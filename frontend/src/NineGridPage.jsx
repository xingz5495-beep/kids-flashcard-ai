import { useState } from 'react';
import html2canvas from 'html2canvas';

const MAX_WORDS = 9;

function pickColor(i) {
  const colors = ['#2f855a', '#c53030', '#2b6cb0', '#d69e2e', '#805ad5', '#dd6b20', '#3182ce', '#38a169', '#d53f8c'];
  return colors[i % colors.length];
}

export default function NineGridPage() {
  const [inputs, setInputs] = useState(Array(MAX_WORDS).fill(''));
  const [images, setImages] = useState({}); // { word: url }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const words = inputs.map(w => w.trim()).filter(Boolean);
  const cols = words.length <= 4 ? 2 : 3; // 1-4 用 2 列，5-9 用 3 列

  const handleChange = (idx, value) => {
    const copy = [...inputs];
    copy[idx] = value;
    setInputs(copy);
  };

  const generateImages = async () => {
    if (words.length === 0) {
      setError('请至少输入一个单词');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || '生成失败');
      const map = {};
      data.images.forEach(item => {
        if (item.image_url) map[item.word] = item.image_url;
      });
      setImages(map);
    } catch (e) {
      setError(e.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const downloadGrid = async () => {
    const grid = document.getElementById('card-grid');
    if (!grid) return;
    const canvas = await html2canvas(grid, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards-grid.png';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto mb-6 bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">9 宫格单词学习卡片（v0.1）</h1>
        <p className="text-sm text-gray-600 mb-4">
          最多输入 9 个单词，AI 为每个单词生成一张图片，并自动排版在同一张大图中，可用于打印。
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {inputs.map((val, idx) => (
            <input
              key={idx}
              type="text"
              value={val}
              onChange={e => handleChange(idx, e.target.value)}
              placeholder={`单词 ${idx + 1}`}
              className="border rounded px-2 py-1 text-sm"
            />
          ))}
        </div>

        <p className="text-xs text-gray-500 mb-4">
          当前有效单词：{words.length} 个，将排成 {cols} 列的宫格。
        </p>

        <div className="flex gap-3 mb-2">
          <button
            onClick={generateImages}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white text-sm ${
              loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? '生成中…' : '生成图片'}
          </button>

          <button
            onClick={downloadGrid}
            className="px-4 py-2 rounded-lg text-white text-sm bg-green-500 hover:bg-green-600"
          >
            下载整张图片
          </button>
        </div>

        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      </div>

      {/* 宫格预览区：这个区域会被导出为 PNG */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-8 flex justify-center">
        <div
          id="card-grid"
          className="grid gap-6"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {words.map((w, idx) => (
            <div key={idx} className="rounded-3xl overflow-hidden shadow-lg bg-white">
              <div
                className="h-10 flex items-center px-3 text-white text-sm font-semibold"
                style={{ backgroundColor: pickColor(idx) }}
              >
                {w}
              </div>
              <div className="bg-gray-100 aspect-[3/4] flex items-center justify-center">
                {images[w] ? (
                  <img src={images[w]} alt={w} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs">等待生成图片</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
