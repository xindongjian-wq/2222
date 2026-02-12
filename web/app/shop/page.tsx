'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  user: {
    id: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  bot: {
    id: string;
    name: string;
    avatarUrl?: string;
    skin: {
      color: string;
      style: string;
      accessories: string[];
    };
    level: number;
    xp: number;
    coins: number;
    titles: string[];
    currentScene: string;
    mood: string;
    status: string;
  } | null;
}

interface ShopItem {
  id: string;
  name: string;
  type: 'color' | 'style' | 'accessory' | 'title';
  price: number;
  description: string;
  value: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-500',
  epic: 'from-purple-400 to-purple-500',
  legendary: 'from-amber-400 to-orange-500',
};

const RARITY_NAMES = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const SHOP_ITEMS: ShopItem[] = [
  // 颜色
  { id: 'color_red', name: '热情红', type: 'color', price: 50, description: '充满活力的红色', value: '#ef4444', rarity: 'common' },
  { id: 'color_blue', name: '天空蓝', type: 'color', price: 50, description: '清澈的天空蓝', value: '#3b82f6', rarity: 'common' },
  { id: 'color_green', name: '自然绿', type: 'color', price: 50, description: '清新的自然绿', value: '#22c55e', rarity: 'common' },
  { id: 'color_purple', name: '神秘紫', type: 'color', price: 100, description: '神秘的紫色', value: '#a855f7', rarity: 'rare' },
  { id: 'color_pink', name: '樱花粉', type: 'color', price: 100, description: '温柔的樱花粉', value: '#ec4899', rarity: 'rare' },
  { id: 'color_gold', name: '奢华金', type: 'color', price: 200, description: '尊贵的金色', value: '#f59e0b', rarity: 'epic' },
  { id: 'color_rainbow', name: '彩虹', type: 'color', price: 500, description: '独特的渐变彩虹', value: 'rainbow', rarity: 'legendary' },

  // 风格
  { id: 'style_round', name: '圆润', type: 'style', price: 100, description: '更加圆润的造型', value: 'round', rarity: 'common' },
  { id: 'style_square', name: '方正', type: 'style', price: 100, description: '稳重的方形造型', value: 'square', rarity: 'common' },
  { id: 'style_glowing', name: '发光', type: 'style', price: 300, description: '自带发光效果', value: 'glowing', rarity: 'epic' },

  // 配饰
  { id: 'acc_glasses', name: '眼镜', type: 'accessory', price: 150, description: '斯文的眼镜', value: 'glasses', rarity: 'rare' },
  { id: 'acc_hat', name: '帽子', type: 'accessory', price: 150, description: '时尚的帽子', value: 'hat', rarity: 'rare' },
  { id: 'acc_crown', name: '皇冠', type: 'accessory', price: 500, description: '王者象征', value: 'crown', rarity: 'legendary' },
  { id: 'acc_wings', name: '翅膀', type: 'accessory', price: 400, description: '天使之翼', value: 'wings', rarity: 'epic' },

  // 称号
  { id: 'title_first', name: '初出茅庐', type: 'title', price: 100, description: '第一次参赛', value: '初出茅庐', rarity: 'common' },
  { id: 'title_team', name: '团队合作', type: 'title', price: 200, description: '优秀的队友', value: '团队合作', rarity: 'rare' },
  { id: 'title_creative', name: '创意之星', type: 'title', price: 300, description: '创意无限', value: '创意之星', rarity: 'epic' },
  { id: 'title_champion', name: '竞技冠军', type: 'title', price: 1000, description: '赛场王者', value: '竞技冠军', rarity: 'legendary' },
];

export default function ShopPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const userData = await res.json();
        if (userData.code === 0) {
          setUserInfo(userData.data);
          // 已拥有的物品
          const owned = new Set<string>();
          if (userData.data.bot) {
            owned.add(`color_${userData.data.bot.skin.color}`);
            owned.add(`style_${userData.data.bot.skin.style}`);
            userData.data.bot.skin.accessories?.forEach((acc: string) => {
              owned.add(`acc_${acc}`);
            });
            userData.data.bot.titles?.forEach((title: string) => {
              owned.add(`title_${title}`);
            });
          }
          setPurchasedItems(owned);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!userInfo?.bot) return;

    if (userInfo.bot.coins < item.price) {
      showNotification('金币不足！');
      return;
    }

    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });

      const result = await res.json();
      if (result.code === 0) {
        showNotification(`购买成功：${item.name}`);
        setPurchasedItems(new Set(purchasedItems).add(item.id));
        fetchData(); // 刷新用户信息
      } else {
        showNotification(result.error || '购买失败');
      }
    } catch (error) {
      showNotification('购买失败');
    }
  };

  const handleEquip = async (item: ShopItem) => {
    try {
      const res = await fetch('/api/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, type: item.type, value: item.value }),
      });

      const result = await res.json();
      if (result.code === 0) {
        showNotification(`已装备：${item.name}`);
        fetchData();
      } else {
        showNotification(result.error || '装备失败');
      }
    } catch (error) {
      showNotification('装备失败');
    }
  };

  const filteredItems = SHOP_ITEMS.filter(
    item => selectedType === 'all' || item.type === selectedType
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-500"></div>
      </div>
    );
  }

  if (!userInfo?.bot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">请先登录</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">AI 竞技场</h1>
          </button>

          {/* 金币显示 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-50 rounded-full px-4 py-2">
              <span className="text-2xl">🪙</span>
              <span className="font-bold text-yellow-600">{userInfo.bot.coins}</span>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: userInfo.bot.skin.color }}
            >
              {userInfo.bot.name?.[0] || 'AI'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 当前装备 */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">当前装备</h2>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg"
              style={{ backgroundColor: userInfo.bot.skin.color }}
            >
              {userInfo.bot.name?.[0] || 'AI'}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">{userInfo.bot.name}</div>
              <div className="text-sm text-gray-500">
                颜色: {userInfo.bot.skin.color} · 风格: {userInfo.bot.skin.style}
              </div>
              <div className="text-sm text-gray-500">
                配饰: {userInfo.bot.skin.accessories?.join(', ') || '无'}
              </div>
              {userInfo.bot.titles.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {userInfo.bot.titles.map((title, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded text-xs">
                      {title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', name: '全部', icon: '🛒' },
            { id: 'color', name: '颜色', icon: '🎨' },
            { id: 'style', name: '风格', icon: '✨' },
            { id: 'accessory', name: '配饰', icon: '👑' },
            { id: 'title', name: '称号', icon: '🏷️' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedType === type.id
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-amber-50'
              }`}
            >
              {type.icon} {type.name}
            </button>
          ))}
        </div>

        {/* 商品列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const owned = purchasedItems.has(item.id);
            return (
              <div
                key={item.id}
                className={`card overflow-hidden ${
                  owned ? 'ring-2 ring-green-400' : ''
                }`}
              >
                {/* 稀有度标识 */}
                <div className={`h-2 bg-gradient-to-r ${RARITY_COLORS[item.rarity]}`} />

                <div className="p-4">
                  {/* 物品预览 */}
                  <div className="h-24 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl mb-3 flex items-center justify-center">
                    {item.type === 'color' && (
                      <div
                        className="w-16 h-16 rounded-2xl shadow-lg"
                        style={{
                          backgroundColor: item.value === 'rainbow'
                            ? 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)'
                            : item.value,
                        }}
                      />
                    )}
                    {item.type === 'style' && (
                      <span className="text-4xl">✨</span>
                    )}
                    {item.type === 'accessory' && (
                      <span className="text-4xl">
                        {item.value === 'glasses' && '👓'}
                        {item.value === 'hat' && '🎩'}
                        {item.value === 'crown' && '👑'}
                        {item.value === 'wings' && '🪽'}
                      </span>
                    )}
                    {item.type === 'title' && (
                      <span className="text-4xl">🏷️</span>
                    )}
                  </div>

                  {/* 物品信息 */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.rarity === 'legendary' ? 'bg-amber-100 text-amber-600' :
                      item.rarity === 'epic' ? 'bg-purple-100 text-purple-600' :
                      item.rarity === 'rare' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {RARITY_NAMES[item.rarity]}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-3">{item.description}</p>

                  {/* 价格和操作 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span>🪙</span>
                      <span className="font-bold text-yellow-600">{item.price}</span>
                    </div>

                    {owned ? (
                      <button
                        onClick={() => handleEquip(item)}
                        className="px-4 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        装备
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={!userInfo.bot || userInfo.bot.coins < item.price}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          !userInfo.bot || userInfo.bot.coins < item.price
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-lg'
                        }`}
                      >
                        购买
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 通知 */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg">
          {notification}
        </div>
      )}
    </div>
  );
}
