/**
 * TikFinityManager — TikFinity連携モジュール
 * WebSocket接続 + postMessage 両対応
 */
class TikFinityManager {
    constructor() {
        this.game = null;
        this.heartCount = 0;
        this.likeCount = 0;
        this.wsConnection = null;
        this.connectionState = 'disconnected'; // disconnected | connecting | connected
        this.reconnectTimer = null;
        this.reconnectInterval = 3000;
        this.wsPort = 21213;

        // Gift notification queue (displayed on canvas)
        this.notifications = [];
        this.maxNotifications = 4;
        this.notificationDuration = 180; // frames (~3.75s at 48fps)

        // Debug log element reference
        this.debugBox = null;
        this.statusIndicator = null;

        // Gift mapping table
        this.giftMap = {
            'Heart': { action: 'heartAccum', label: 'ハート' },
            'ハート': { action: 'heartAccum', label: 'ハート' },
            'Heart Me': { action: 'spawnEnemy', type: 'sniper', label: 'ハートミー → 狙撃兵' },
            'ハートミー': { action: 'spawnEnemy', type: 'sniper', label: 'ハートミー → 狙撃兵' },
            'Rose': { action: 'spawnEnemy', type: 'wave', label: 'バラ → ウェーブ兵' },
            'バラ': { action: 'spawnEnemy', type: 'wave', label: 'バラ → ウェーブ兵' },
            'Donut': { action: 'spawnBarrel', label: 'ドーナッツ → アイテム岩' },
            'Doughnut': { action: 'spawnBarrel', label: 'ドーナッツ → アイテム岩' },
            'ドーナッツ': { action: 'spawnBarrel', label: 'ドーナッツ → アイテム岩' },
            'ドーナツ': { action: 'spawnBarrel', label: 'ドーナツ → アイテム岩' },
            'Money Gun': { action: 'forceBoss', index: 0, label: 'マネーガン → BEAM BOSS!' },
            'マネーガン': { action: 'forceBoss', index: 0, label: 'マネーガン → BEAM BOSS!' },
            'GG': { action: 'spawnGate', modifier: '+2', label: 'GG → +2ゲート' },
            'Lion': { action: 'forceBossRandom', label: 'ライオン → ランダムBOSS!' },
            'ライオン': { action: 'forceBossRandom', label: 'ライオン → ランダムBOSS!' },
            'Finger Heart': { action: 'spawnGate', modifier: '+1', label: 'フィンガーハート → +1ゲート' },
            'Rosa': { action: 'spawnEnemy', type: 'wave', label: 'ローザ → ウェーブ兵' },
            'Perfume': { action: 'spawnObstacle', label: 'パフューム → 障害物' },
            'パフューム': { action: 'spawnObstacle', label: 'パフューム → 障害物' },
            'TikTok': { action: 'forceBoss', index: 1, label: 'TikTok → BOMB BOSS!' },
        };
    }

    /**
     * Initialize — called once after DOM is ready
     */
    init() {
        this.setupPostMessageListener();
        this.attemptWebSocketConnection();

        // Check for CID param
        const urlParams = new URLSearchParams(window.location.search);
        const cid = urlParams.get('cid');
        if (cid) {
            this.log(`CID: ${cid} にリンク済み`);
        }
    }

    /**
     * Set the game instance reference
     */
    setGame(game) {
        this.game = game;
    }

    // ─── WebSocket Connection ───────────────────────────────

    attemptWebSocketConnection() {
        if (this.connectionState === 'connected') return;
        this.connectionState = 'connecting';

        try {
            this.wsConnection = new WebSocket(`ws://localhost:${this.wsPort}`);

            this.wsConnection.onopen = () => {
                this.connectionState = 'connected';
                this.log('WebSocket: 接続成功');
                if (this.reconnectTimer) {
                    clearInterval(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.wsConnection.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleTikFinityEvent(data);
                } catch (e) {
                    this.log('WebSocket: パースエラー');
                }
            };

            this.wsConnection.onclose = () => {
                this.connectionState = 'disconnected';
                this.log('WebSocket: 切断');
                this.scheduleReconnect();
            };

            this.wsConnection.onerror = () => {
                this.connectionState = 'disconnected';
                this.scheduleReconnect();
            };
        } catch (e) {
            this.connectionState = 'disconnected';
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setInterval(() => {
            if (this.connectionState !== 'connected') {
                this.attemptWebSocketConnection();
            }
        }, this.reconnectInterval);
    }

    // ─── PostMessage Listener (Overlay Fallback) ────────────

    setupPostMessageListener() {
        window.addEventListener('message', (event) => {
            let data = event.data;
            if (typeof data === 'string' && data.includes('{')) {
                try { data = JSON.parse(data); } catch (e) { return; }
            }

            if (!data) return;

            // Handle the "Action/Event" format from TikFinity Overlay (居候モード)
            if (data.type === 'action' && data.event === 'gift') {
                this.handleGiftEvent(
                    data.giftName,
                    data.count || 1,
                    data.nickname || data.username || '視聴者',
                    false
                );
            }
            // Handle secondary TikFinity format or Simulator format
            else if (data.type === 'gift') {
                this.handleGiftEvent(
                    data.giftName,
                    data.giftAmount || data.count || 1,
                    data.nickname || data.username || 'Test User',
                    data.isLocal || false
                );
            }
        });
    }

    // ─── Event Handlers ─────────────────────────────────────

    handleTikFinityEvent(data) {
        if (!data || !data.event) return;
        const viewer = data.nickname || data.username || '視聴者';

        switch (data.event) {
            case 'gift':
                this.handleGiftEvent(
                    data.giftName,
                    data.repeatCount || data.giftAmount || 1,
                    viewer,
                    false
                );
                break;

            case 'follow':
                this.log(`[Follow] ${viewer} がフォロー!`);
                this.addNotification(viewer, 'フォロー！', '#00ff88');
                if (this.game && !this.game.gameOver) {
                    this.game.spawnGate('+1');
                }
                break;

            case 'like':
                const likeCount = data.likeCount || 1;
                this.likeCount += likeCount;
                if (this.likeCount >= 50) {
                    this.log(`[Like] いいね${this.likeCount}個到達 → アイテム岩`);
                    if (this.game && !this.game.gameOver) {
                        this.game.spawnBarrel();
                    }
                    this.likeCount = 0;
                }
                break;

            case 'chat':
                // Chat commands (e.g., !boss, !help)
                const msg = (data.commandParams || data.comment || '').trim();
                if (msg.startsWith('!boss') && this.game && !this.game.gameOver) {
                    this.log(`[Chat] ${viewer}: !boss コマンド`);
                    this.game.spawnEnemy('chaser');
                }
                break;
        }
    }

    handleGiftEvent(giftName, amount, viewer, isLocal) {
        const source = isLocal ? '[テスト]' : '[TikTok]';
        this.log(`${source} ${viewer}: ${giftName} x${amount}`);

        // Update status if receiving real events (internal state only)
        if (!isLocal && this.connectionState !== 'connected') {
            this.connectionState = 'connected';
        }

        if (!this.game || this.game.gameOver) {
            this.log('⚠ ミッション未開始');
            return;
        }

        const mapping = this.giftMap[giftName];
        if (!mapping) {
            this.log(`未登録ギフト: ${giftName}`);
            return;
        }

        for (let i = 0; i < amount; i++) {
            this.executeGiftAction(mapping, viewer, giftName);
        }
    }

    executeGiftAction(mapping, viewer, giftName) {
        switch (mapping.action) {
            case 'heartAccum':
                this.heartCount++;
                if (this.heartCount >= 10) {
                    this.game.spawnEnemy('chaser');
                    this.addNotification(viewer, 'ハート兵 出現!', '#ff3366');
                    this.log(`Spawn: ハート兵 (${viewer})`);
                    this.heartCount = 0;
                }
                break;

            case 'spawnEnemy':
                this.game.spawnEnemy(mapping.type);
                this.addNotification(viewer, mapping.label, this.getEnemyColor(mapping.type));
                this.log(`Spawn: ${mapping.label} (${viewer})`);
                break;

            case 'spawnBarrel':
                this.game.spawnBarrel();
                this.addNotification(viewer, mapping.label, '#aaaaaa');
                this.log(`Spawn: ${mapping.label} (${viewer})`);
                break;

            case 'spawnObstacle':
                this.game.spawnObstacle();
                this.addNotification(viewer, mapping.label, '#666666');
                this.log(`Spawn: ${mapping.label} (${viewer})`);
                break;

            case 'spawnGate':
                this.game.spawnGate(mapping.modifier);
                this.addNotification(viewer, mapping.label, '#00ffcc');
                this.log(`Spawn: ${mapping.label} (${viewer})`);
                break;

            case 'forceBoss':
                this.game.forceBossSpawn(mapping.index);
                this.addNotification(viewer, mapping.label, '#ff0000');
                this.log(`BOSS: ${mapping.label} (${viewer})`);
                break;

            case 'forceBossRandom':
                const idx = Math.floor(Math.random() * this.game.bossClasses.length);
                this.game.forceBossSpawn(idx);
                this.addNotification(viewer, mapping.label, '#ffaa00');
                this.log(`BOSS: ${mapping.label} (${viewer})`);
                break;
        }
    }

    getEnemyColor(type) {
        switch (type) {
            case 'chaser': return '#ff3366';
            case 'wave': return '#33ccff';
            case 'sniper': return '#ffcc00';
            default: return '#ffffff';
        }
    }

    // ─── Notification System (on-canvas display) ────────────

    addNotification(viewer, message, color) {
        this.notifications.push({
            viewer: viewer || '???',
            message,
            color: color || '#ffffff',
            life: this.notificationDuration,
            maxLife: this.notificationDuration
        });
        // Trim oldest if over max
        while (this.notifications.length > this.maxNotifications) {
            this.notifications.shift();
        }
    }

    updateNotifications() {
        this.notifications.forEach(n => n.life--);
        this.notifications = this.notifications.filter(n => n.life > 0);
    }

    drawNotifications(ctx, canvasWidth) {
        if (this.notifications.length === 0) return;

        ctx.save();
        const startY = 45;
        const lineHeight = 28;

        this.notifications.forEach((n, i) => {
            const alpha = Math.min(1, n.life / 30); // fade out in last 30 frames
            const slideIn = Math.min(1, (n.maxLife - n.life) / 10); // slide in over 10 frames

            ctx.globalAlpha = alpha;
            const x = canvasWidth / 2;
            const y = startY + i * lineHeight;

            // Background pill
            const text = `${n.viewer} ▸ ${n.message}`;
            ctx.font = 'bold 13px "Segoe UI", sans-serif';
            const textWidth = ctx.measureText(text).width;
            const pillWidth = textWidth + 24;
            const pillX = x - pillWidth / 2;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.roundRect(pillX, y - 10, pillWidth, 22, 11);
            ctx.fill();

            // Colored left accent
            ctx.fillStyle = n.color;
            ctx.beginPath();
            ctx.arc(pillX + 8, y + 1, 4, 0, Math.PI * 2);
            ctx.fill();

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x + 4, y + 1);
        });

        ctx.restore();
    }

    log(msg) {
        const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        console.log(`[TikFinity][${time}] ${msg}`);
    }
}
