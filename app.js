const json = localStorage.getItem(STATE_KEY); if (!json) return null; return JSON.parse(json); } catch (e) { console.error('Failed to load state', e); return null; } }
// ★ サムネイル用に画像全体をnavCanvas に描く
