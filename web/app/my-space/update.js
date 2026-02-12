const fs = require('fs');

const src = 'page.tsx.new';
const dst = 'page.tsx';

let content = fs.readFileSync(src, 'utf8');

// 1. 修改配置
content = content.replace('const HEX_SIZE = 36;', 'const HEX_SIZE = 85;');
content = content.replace('const HEX_DEPTH = 14;', 'const HEX_HEIGHT = 35;');
content = content.replace('const HEX_GAP = 1;', '// 已删除HEX_GAP');

// 2. 修改 axialToScreen 函数的y计算
content = content.replace(
  "const y = HEX_SIZE * 1.5 * r;",
  "const y = HEX_SIZE * 2 * 0.75 * r;"
);

// 3. 在 axialToScreen 后添加辅助函数
const helpers = `
// 颜色辅助函数
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return 'rgb(' + R + ',' + G + ',' + B + ')';
}

function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return 'rgb(' + R + ',' + G + ',' + B + ')';
}

`;

content = content.replace('return { x, y };\n}', 'return { x, y };' + helpers + '}');

// 4. 替换 drawHexTile 为 draw3DHexTile
const oldDrawFn = `
function drawHexTile(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  color: string,
  sceneEmoji?: string,
  sceneColor?: string
) {
  const screen = axialToScreen(q, r);
  const size = HEX_SIZE - HEX_GAP;

  // 如果有场景，使用场景颜色
  const tileColor = sceneColor || color;

  ctx.fillStyle = tileColor;
  ctx.beginPath();
  ctx.moveTo(screen.x + 3, screen.y + HEX_DEPTH + 3);
  for (let i = 0; i < 6; i++) {
    const angle = (2 * Math.PI / 6) * i;
    const px = screen.x + size * Math.cos(angle);
    const py = screen.y + size * Math.sin(angle);
    if (i === 0) ctx.lineTo(px + 3, py + HEX_DEPTH + 3);
    else ctx.lineTo(px + 3, py + HEX_DEPTH + 3);
  }
  ctx.closePath();
  ctx.fill();

  // 如果有场景emoji，绘制在中心
  if (sceneEmoji) {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sceneEmoji, screen.x + 3, screen.y + HEX_DEPTH + 3);
  }

  // 绘制边框
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
}
`;

const newDrawFn = `
function draw3DHexTile(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  baseColor: string,
  sceneEmoji?: string,
  sceneColor?: string,
  isSelected?: boolean,
  index?: number
) {
  const screen = axialToScreen(q, r);
  const size = HEX_SIZE - 1.5;
  const tileColor = sceneColor || baseColor;

  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (2 * Math.PI / 6) * (i - 0.5);
    const px = screen.x + size * Math.cos(angle);
    const py = screen.y + size * Math.sin(angle);
    vertices.push({ x: px, y: py });
  }

  const thickness = HEX_HEIGHT;
  const p2 = vertices[2];
  const p3 = vertices[3];
  const angleRight = Math.PI / 6;

  ctx.beginPath();
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p3.x + thickness * Math.cos(angleRight), p3.y + thickness * Math.sin(angleRight));
  ctx.lineTo(p2.x + thickness * Math.cos(angleRight), p2.y + thickness * Math.sin(angleRight));
  ctx.closePath();
  ctx.fillStyle = darkenColor(tileColor, 35);
  ctx.fill();

  const p4 = vertices[4];
  const angleLeft = Math.PI / 3;

  ctx.beginPath();
  ctx.moveTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.lineTo(p4.x + thickness * Math.cos(angleLeft), p4.y + thickness * Math.sin(angleLeft));
  ctx.lineTo(p3.x + thickness * Math.cos(angleRight), p3.y + thickness * Math.sin(angleRight));
  ctx.closePath();
  ctx.fillStyle = darkenColor(tileColor, 25);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.closePath();

  const gradient = ctx.createLinearGradient(
    vertices[0].x, vertices[0].y - 20,
    vertices[3].x, vertices[3].y + 20
  );
  gradient.addColorStop(0, lightenColor(tileColor, 20));
  gradient.addColorStop(0.3, tileColor);
  gradient.addColorStop(1, darkenColor(tileColor, 15));
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = isSelected ? '#fbbf24' : 'rgba(255,255,255,0.5)';
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.stroke();

  if (sceneEmoji) {
    ctx.save();
    ctx.translate(screen.x, screen.y - 10);
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.font = '44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sceneEmoji, 0, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(screen.x - size * 0.3, screen.y - size * 0.4, size * 0.15, 0, Math.PI * 2);
  const highlightGrad = ctx.createRadialGradient(
    screen.x - size * 0.3, screen.y - size * 0.4, 0,
    screen.x - size * 0.3, screen.y - size * 0.4, size * 0.15
  );
  highlightGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
  highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = highlightGrad;
  ctx.fill();

  if (index !== undefined) {
    const badgeX = screen.x + size * 0.55;
    const badgeY = screen.y - size * 0.55;

    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 18, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#f59e0b' : '#8b5cf6';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), badgeX, badgeY);
  }
}
`;

content = content.replace(oldDrawFn, newDrawFn);

// 5. 添加 hoveredLandIndex 状态
content = content.replace(
  "const [showSceneModal, setShowSceneModal] = useState(false);",
  "const [showSceneModal, setShowSceneModal] = useState(false);\n  const [hoveredLandIndex, setHoveredLandIndex] = useState<number | null>(null);"
);

// 6. 修改Canvas渲染中的调用
const oldRenderCall = `
        drawHexTile(ctx, pos.q, pos.r, scenePreset?.baseColor || '#d1d5db', scenePreset?.emoji, scenePreset?.color);

        // 绘制边框
        ctx.strokeStyle = isSelected ? '#fbbf24' : (isMine ? '#8b5cf6' : 'rgba(255,255,255,0.3)');
        ctx.lineWidth = isSelected ? 3 : (isMine ? 2 : 1);
        ctx.stroke();

        // 如果是用户的地块，显示编号
        if (isMine) {
          ctx.fillStyle = '#374151';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          const screen = axialToScreen(pos.q, pos.r);
          ctx.fillText(\`\${index + 1}\`, screen.x + 3, screen.y - 10);
        }`;

const newRenderCall = `
        const isHovered = hoveredLandIndex === index;
        draw3DHexTile(
          ctx, pos.q, pos.r,
          scenePreset?.baseColor || '#94a3b8',
          scenePreset?.emoji,
          scenePreset?.color,
          isSelected || isHovered,
          isMine ? index : undefined
        );`;

content = content.replace(oldRenderCall, newRenderCall);

// 7. 修改useEffect的依赖
content = content.replace(
  '}, [userScenes, scenePresets, extendedScenes, selectedLandIndex, scale, pan, user, viewUser]);',
  '}, [userScenes, scenePresets, extendedScenes, selectedLandIndex, hoveredLandIndex, scale, pan, user, viewUser]);'
);

// 8. 修改Canvas背景，添加渐变
content = content.replace(
  "ctx.fillStyle = '#f8fafc';\n      ctx.fillRect(-700, -500, 1400, 1000);",
  "const bgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 800);\n      bgGradient.addColorStop(0, '#f1f5f9');\n      bgGradient.addColorStop(1, '#e2e8f0');\n      ctx.fillStyle = bgGradient;\n      ctx.fillRect(-700, -500, 1400, 1000);"
);

// 9. 修改Canvas中心y位置
content = content.replace('ctx.translate(700 + pan.x, 450 + pan.y);', 'ctx.translate(700 + pan.x, 380 + pan.y);');

// 10. 修改handleCanvasClick中的HEX_SIZE判断
content = content.replace('< HEX_SIZE * 0.8)', '< HEX_SIZE * 0.85)');

// 11. 修改handleMouseMove添加悬停检测
const oldMouseMovePart = `  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };`;

const newMouseMovePart = `  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const rawX = (e.clientX - rect.left) * scaleX - canvas.width / 2 - pan.x;
      const rawY = (e.clientY - rect.top) * scaleY - canvas.height / 2 - pan.y;
      const mouseX = rawX / scale;
      const mouseY = rawY / scale;

      let foundHover = null;
      LAND_POSITIONS.forEach((pos, index) => {
        const screen = axialToScreen(pos.q, pos.r);
        const dist = Math.sqrt((mouseX - screen.x) ** 2 + (mouseY - screen.y) ** 2);
        if (dist < HEX_SIZE * 0.85) {
          foundHover = index;
        }
      });
      setHoveredLandIndex(foundHover);
    }
  };`;

content = content.replace(oldMouseMovePart, newMouseMovePart);

// 12. 添加鼠标离开处理
content = content.replace(
  'const handleMouseUp = () => setIsDragging(false);',
  'const handleMouseUp = () => setIsDragging(false);\\n  const handleMouseLeave = () => setHoveredLandIndex(null);'
);

// 13. 修改canvas的onMouseLeave属性
content = content.replace('onMouseUp={handleMouseUp}', 'onMouseUp={handleMouseUp}\\n            onMouseLeave={handleMouseLeave}');

fs.writeFileSync(dst, content, 'utf8');
console.log('File updated successfully!');
