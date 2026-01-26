const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hpEl = document.getElementById("hp");
const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const goldEl = document.getElementById("gold");

const mainMenuEl = document.getElementById("main-menu");
const shopMenuEl = document.getElementById("shop-menu");
const gameOverEl = document.getElementById("game-over");
const finalScoreEl = document.getElementById("final-score");
const finalWaveEl = document.getElementById("final-wave");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const menuBtn = document.getElementById("menu-btn");
const shopBtn = document.getElementById("shop-btn");
const backFromShopBtn = document.getElementById("back-from-shop");
const shopItemsEl = document.getElementById("shop-items");
const shopGoldEl = document.getElementById("shop-gold");
const playerPreviewCanvas = document.getElementById("player-preview");
const playerPreviewCtx = playerPreviewCanvas ? playerPreviewCanvas.getContext("2d") : null;
const leaderboardBtn = document.getElementById("leaderboard-btn");
const checkinBtn = document.getElementById("checkin-btn");
const leaderboardMenuEl = document.getElementById("leaderboard-menu");
const checkinMenuEl = document.getElementById("checkin-menu");
const backFromLeaderboardBtn = document.getElementById("back-from-leaderboard");
const backFromCheckinBtn = document.getElementById("back-from-checkin");
const leaderboardListEl = document.getElementById("leaderboard-list");
const nicknameInput = document.getElementById("nickname-input");
const checkinCountEl = document.getElementById("checkin-count");
const checkinMultiplierEl = document.getElementById("checkin-multiplier");
const checkinTimerLabelEl = document.getElementById("checkin-timer-label");
const checkinTimerEl = document.getElementById("checkin-timer");
const checkinStatusEl = document.getElementById("checkin-status");
const checkinActionBtn = document.getElementById("checkin-action");

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;

function resizeCanvas() {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
}

resizeCanvas();

const keys = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false };
let mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

// Единственный персонаж
const PLAYER_STATS = {
  name: "Боец",
  maxHp: 100,
  baseSpeed: 3.2,
  radius: 16,
  color: "#0fffd2",
  glowColor: "rgba(90, 255, 210, 0.8)",
  baseReloadSpeed: 1.0, // множитель скорости перезарядки
};

// Определения оружия
const WEAPONS = {
  pistol: {
    name: "Пистолет",
    fireDelay: 160,
    magazine: 20,
    maxMagazine: 20,
    reloadTime: 900,
    bulletSpeed: 7.5,
    spread: 0.08,
    damage: 1,
  },
  shotgun: {
    name: "Дробовик",
    fireDelay: 600,
    magazine: 8,
    maxMagazine: 8,
    reloadTime: 1200,
    bulletSpeed: 6.0,
    spread: 0.5, // увеличен разлет пуль из дула
    damage: 1,
    pellets: 4,
  },
  minigun: {
    name: "Миниган",
    fireDelay: 15,
    magazine: 200,
    maxMagazine: 200,
    reloadTime: 3000,
    bulletSpeed: 10.0,
    spread: 0.2,
    damage: 0.7, // уменьшен урон
  },
  rocket_launcher: {
    name: "Ракетница",
    fireDelay: 800, // быстрее стрельба
    magazine: 4,
    maxMagazine: 4,
    reloadTime: 1800,
    bulletSpeed: 6.5, // быстрее пуля
    spread: 0.0,
    damage: 1,
    explosive: true,
    explosionRadius: 90, // увеличен радиус взрыва
  },
  flamethrower: {
    name: "Огнемёт",
    fireDelay: 30,
    magazine: 80,
    maxMagazine: 80,
    reloadTime: 2000,
    bulletSpeed: 4.0,
    spread: 0.12, // уменьшен разброс
    damage: 0.5, // уменьшен урон
    isFlame: true,
  },
};

// Цены в магазине
const SHOP_PRICES = {
  shotgun: 50,
  machinegun: 100,
  rocket_launcher: 150,
  smg: 80,
  minigun: 200,
  grenade_launcher: 130,
};

// Загрузка спрайта зомби (если есть файл)
let zombieSprite = null;
const zombieSpriteImg = new Image();
zombieSpriteImg.onload = () => {
  zombieSprite = zombieSpriteImg;
};
zombieSpriteImg.onerror = () => {
  // Если файл не найден, используем программно созданный спрайт
  zombieSprite = null;
};
zombieSpriteImg.src = "zombie.png"; // Путь к спрайту зомби

const state = {
  running: false,
  paused: false, // состояние паузы
  player: null,
  bullets: [],
  enemyBullets: [], // пули врагов
  enemies: [],
  particles: [],
  gold: [], // золотые монеты на карте
  medkits: [], // аптечки на карте
  bonuses: [], // бонусы на карте
  weapons: [], // оружие на карте
  bloodStains: [], // пятна крови на карте
  explosions: [], // анимации взрывов
  notifications: [], // уведомления о подборе предметов
  score: 0,
  goldAmount: 0, // баланс золота
  playerSpeedBoost: 0, // таймер ускорения игрока
  playerShield: 0, // таймер щита игрока (неуязвимость)
  enemiesFrozen: 0, // таймер заморозки врагов
  laserCannon: 0, // таймер бластерной пушки (20 секунд)
  wave: 1,
  spawnTimer: 0,
  spawnPoints: [], // 3 рандомные точки спауна на карте
  enemyQueue: [], // очередь врагов для постепенного спауна
  lastSpawnTime: 0, // время последнего спауна врага
  currentWeapon: "pistol", // текущее оружие
  gameMode: "arcade", // "arena" или "arcade"
  checkpoints: [], // чекпоинты в режиме Аркада
  bosses: [], // боссы в режиме Аркада
  bossDefeated: false, // флаг, что босс был убит на текущей волне
  waveCompleteMessage: null, // сообщение о завершении волны
  upgrades: {
    maxHp: 0, // дополнительные HP
    reloadSpeed: 0, // улучшение скорости перезарядки (в процентах)
    fireRate: 0, // улучшение скорострельности (в процентах)
    moveSpeed: 0, // улучшение скорости движения (в процентах)
  },
};

const CHECKIN_STORAGE_KEY = "crimsonland_checkin";
const ARCADE_GOLD_STORAGE_KEY = "crimsonland_arcade_gold";
const LEADERBOARD_STORAGE_KEY = "crimsonland_leaderboard";
const NICKNAME_STORAGE_KEY = "crimsonland_nickname";

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // ignore storage errors
  }
}

function getStoredNickname() {
  const raw = loadJson(NICKNAME_STORAGE_KEY, "");
  if (typeof raw !== "string") return "";
  return raw.slice(0, 16);
}

function setStoredNickname(value) {
  const nickname = value.trim().slice(0, 16);
  saveJson(NICKNAME_STORAGE_KEY, nickname);
}

function getStoredArcadeGold() {
  const value = Number(loadJson(ARCADE_GOLD_STORAGE_KEY, 0));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function setStoredArcadeGold(value) {
  if (state.gameMode !== "arcade") return;
  const safeValue = Math.max(0, Math.floor(value));
  saveJson(ARCADE_GOLD_STORAGE_KEY, safeValue);
}

function getUtcDayKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseUtcDayKey(dayKey) {
  if (!dayKey) return null;
  const [year, month, day] = dayKey.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function diffUtcDays(fromKey, toKey) {
  const fromDate = parseUtcDayKey(fromKey);
  const toDate = parseUtcDayKey(toKey);
  if (!fromDate || !toDate) return 0;
  return Math.floor((toDate - fromDate) / 86400000);
}

function normalizeCheckinState(raw) {
  const data = {
    count: 0,
    lastDay: null,
    ...raw,
  };

  if (!Number.isFinite(data.count) || data.count < 0) {
    data.count = 0;
  }

  if (typeof data.lastDay !== "string") {
    data.lastDay = null;
  }

  if (data.lastDay) {
    const todayKey = getUtcDayKey();
    const diff = diffUtcDays(data.lastDay, todayKey);
    if (diff >= 2) {
      data.count = 0;
      data.lastDay = null;
    } else if (diff < 0) {
      data.lastDay = todayKey;
    }
  }

  return data;
}

function getCheckinState() {
  const raw = loadJson(CHECKIN_STORAGE_KEY, { count: 0, lastDay: null });
  const normalized = normalizeCheckinState(raw);
  if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
    saveJson(CHECKIN_STORAGE_KEY, normalized);
  }
  return normalized;
}

function saveCheckinState(data) {
  saveJson(CHECKIN_STORAGE_KEY, data);
}

function getGoldMultiplierFromCheckins(count) {
  return 1 + count * 0.1;
}

function getCheckinGoldMultiplier() {
  const { count } = getCheckinState();
  return getGoldMultiplierFromCheckins(count);
}

function getNextUtcMidnight(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  return new Date(Date.UTC(year, month, day + 1, 0, 0, 0));
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function setCheckinStatus(message, type = "") {
  if (!checkinStatusEl) return;
  checkinStatusEl.textContent = message;
  checkinStatusEl.classList.remove("success", "error");
  if (type) {
    checkinStatusEl.classList.add(type);
  }
}

function updateCheckinUi() {
  if (!checkinCountEl || !checkinMultiplierEl || !checkinActionBtn || !checkinTimerEl) return;

  const checkinState = getCheckinState();
  const todayKey = getUtcDayKey();
  const checkedInToday = checkinState.lastDay === todayKey;

  checkinCountEl.textContent = checkinState.count;
  checkinMultiplierEl.textContent = `+${Math.round(checkinState.count * 10)}%`;

  const now = new Date();
  const nextMidnight = getNextUtcMidnight(now);
  checkinTimerEl.textContent = formatCountdown(nextMidnight - now);

  if (checkinTimerLabelEl) {
    checkinTimerLabelEl.textContent = checkedInToday ? "До следующего чек-ина:" : "До следующего обновления:";
  }

  if (checkedInToday) {
    checkinActionBtn.disabled = true;
    checkinActionBtn.textContent = "Чек-ин уже выполнен";
  } else {
    checkinActionBtn.disabled = false;
    checkinActionBtn.textContent = "Сделать чек-ин";
  }
}

function handleCheckinAction() {
  const checkinState = getCheckinState();
  const todayKey = getUtcDayKey();
  if (checkinState.lastDay === todayKey) {
    setCheckinStatus("Чек-ин уже выполнен.", "error");
    updateCheckinUi();
    return;
  }

  const confirmed = window.confirm("Подтвердить транзакцию для ежедневного чек-ина?");
  if (!confirmed) {
    setCheckinStatus("Транзакция отменена.", "error");
    return;
  }

  checkinState.count = (checkinState.count || 0) + 1;
  checkinState.lastDay = todayKey;
  saveCheckinState(checkinState);

  setCheckinStatus(`Чек-ин подтвержден! Бонус золота: +${Math.round(checkinState.count * 10)}%.`, "success");
  updateCheckinUi();
}

function loadLeaderboard() {
  const entries = loadJson(LEADERBOARD_STORAGE_KEY, []);
  return Array.isArray(entries) ? entries : [];
}

function saveLeaderboard(entries) {
  saveJson(LEADERBOARD_STORAGE_KEY, entries);
}

function addLeaderboardEntry(score, wave, mode) {
  const entries = loadLeaderboard();
  const nickname = getStoredNickname() || "Игрок";
  entries.push({
    nickname,
    score,
    wave,
    mode,
    date: new Date().toISOString(),
  });

  entries.sort((a, b) => b.score - a.score);
  saveLeaderboard(entries.slice(0, 10));
}

function renderLeaderboard() {
  if (!leaderboardListEl) return;
  const entries = loadLeaderboard();
  leaderboardListEl.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "leaderboard-meta";
    empty.textContent = "Пока нет результатов.";
    leaderboardListEl.appendChild(empty);
    return;
  }

  entries.forEach((entry, index) => {
    const item = document.createElement("div");
    item.className = "leaderboard-item";
    const modeLabel = entry.mode === "arena" ? "Арена" : "Аркада";
    const date = new Date(entry.date);
    const dateLabel = Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
    const metaParts = [entry.nickname || "Игрок", `Волна ${entry.wave}`, modeLabel];
    if (dateLabel) metaParts.push(dateLabel);

    item.innerHTML = `
      <span class="leaderboard-rank">#${index + 1}</span>
      <span class="leaderboard-score">${entry.score}</span>
      <span class="leaderboard-meta">${metaParts.join(" · ")}</span>
    `;
    leaderboardListEl.appendChild(item);
  });
}

class Player {
  constructor() {
    this.x = WIDTH / 2;
    this.y = HEIGHT / 2;
    const stats = PLAYER_STATS;
    const weapon = WEAPONS[state.currentWeapon] || WEAPONS.pistol;

    this.weapon = weapon;
    this.radius = stats.radius;
    // учитываем улучшения скорости
    this.speed = stats.baseSpeed * (1 + state.upgrades.moveSpeed / 100);
    // учитываем улучшения HP
    this.maxHp = stats.maxHp + state.upgrades.maxHp;
    this.hp = this.maxHp;
    if (weapon) {
      // учитываем улучшения скорострельности
      this.fireDelay = weapon.fireDelay / (1 + state.upgrades.fireRate / 100);
      // учитываем улучшения скорости перезарядки
      this.reloadTime = weapon.reloadTime / (stats.baseReloadSpeed * (1 + state.upgrades.reloadSpeed / 100));
      this.magazine = weapon.magazine;
      this.maxMagazine = weapon.maxMagazine;
      this.reloading = false;
      this.reloadStartTime = 0;
    }
    this.lastShot = 0;
  }

  update(dt) {
    let dx = 0;
    let dy = 0;
    if (keys.w || keys.up) dy -= 1;
    if (keys.s || keys.down) dy += 1;
    if (keys.a || keys.left) dx -= 1;
    if (keys.d || keys.right) dx += 1;

    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    // бонус ускорения
    const speedMultiplier = state.playerSpeedBoost > 0 ? 1.5 : 1;
    this.x += dx * this.speed * speedMultiplier * dt;
    this.y += dy * this.speed * speedMultiplier * dt;

    // clamp to arena
    this.x = Math.max(this.radius + 8, Math.min(WIDTH - this.radius - 8, this.x));
    this.y = Math.max(this.radius + 8, Math.min(HEIGHT - this.radius - 8, this.y));
  }

  canShoot(now) {
    // Бластерная пушка стреляет без ограничений по патронам
    if (state.laserCannon > 0) {
      return now - this.lastShot > 200; // задержка между выстрелами бластерной пушки
    }
    return !this.reloading && this.magazine > 0 && now - this.lastShot > this.fireDelay;
  }

  shoot(now) {
    if (!this.canShoot(now)) return;

    // дальний бой
    this.lastShot = now;
    const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
    const weapon = this.weapon;

    // Бластерная пушка (бонус)
    if (state.laserCannon > 0) {
      // Бластерная пушка стреляет мощными зарядами, пробивающими врагов насквозь
      const spread = (Math.random() - 0.5) * 0.05; // минимальный разброс
      const finalAngle = angle + spread;
      const speed = 15.0; // быстрая скорость

      state.bullets.push(
        new Bullet(
          this.x + Math.cos(finalAngle) * this.radius,
          this.y + Math.sin(finalAngle) * this.radius,
          Math.cos(finalAngle) * speed,
          Math.sin(finalAngle) * speed,
          { name: "Бластерная пушка", damage: 3, piercing: true }, // пробивающий урон
        ),
      );
      
      // Визуальный эффект выстрела бластерной пушки
      for (let i = 0; i < 6; i++) {
        const finalAngle = angle + (Math.random() - 0.5) * 0.1;
        state.particles.push(
          new Particle(
            this.x,
            this.y,
            Math.cos(finalAngle) * (3 + Math.random() * 2),
            Math.sin(finalAngle) * (3 + Math.random() * 2),
            100 + Math.random() * 80,
            "rgba(0, 255, 255, 0.95)",
          ),
        );
      }
    } else if (weapon.name === "Дробовик") {
      // дробовик тратит патроны за выстрел
      this.magazine -= 1;
      
      // дробовик стреляет несколькими дробинками + радиус поражения при выстреле
      const shotgunRadius = 80; // радиус поражения при выстреле
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (dist < shotgunRadius + enemy.radius) {
          // враги в радиусе получают урон
          enemy.hp -= 0.5;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            state.score += 10 + state.wave * 2;
            scoreEl.textContent = state.score;

            if (enemy.canDropGold && Math.random() < 0.3) {
              const goldAmount = Math.random() < 0.15 ? 50 : 10;
              state.gold.push(new Gold(enemy.x, enemy.y, goldAmount));
            }
            
            if (state.wave >= 3 && enemy.canDropMedkit && Math.random() < 0.25) {
              state.medkits.push(new Medkit(enemy.x, enemy.y));
            }

            createEnemyDeathEffect(enemy);
          }
        }
      }
      
      for (let i = 0; i < weapon.pellets; i++) {
        const spread = (Math.random() - 0.5) * weapon.spread;
        const finalAngle = angle + spread;
        const speed = weapon.bulletSpeed;

        state.bullets.push(
          new Bullet(
            this.x + Math.cos(finalAngle) * this.radius,
            this.y + Math.sin(finalAngle) * this.radius,
            Math.cos(finalAngle) * speed,
            Math.sin(finalAngle) * speed,
            weapon, // передаём данные оружия для урона
          ),
        );
      }
      
      // автоматическая перезарядка для дробовика
      if (this.magazine === 0 && !this.reloading) {
        this.reload(now);
      }
    } else if (weapon.explosive || weapon.arc) {
      // тратим патрон для взрывного оружия
      this.magazine--;
      
      // автоматическая перезарядка
      if (this.magazine === 0 && !this.reloading) {
        this.reload(now);
      }
      // взрывное оружие (ракетница, гранатомёт)
      const spread = (Math.random() - 0.5) * weapon.spread;
      const finalAngle = angle + spread;
      const speed = weapon.bulletSpeed;

      state.bullets.push(
        new Bullet(
          this.x + Math.cos(finalAngle) * this.radius,
          this.y + Math.sin(finalAngle) * this.radius,
          Math.cos(finalAngle) * speed,
          Math.sin(finalAngle) * speed,
          weapon, // передаём данные оружия для взрыва
        ),
      );
    } else if (weapon.isFlame) {
      // тратим патрон для огнемёта
      this.magazine--;
      
      // огнемёт - стреляет меньшим количеством огненных частиц (уменьшенная мощность)
      for (let i = 0; i < 3; i++) { // уменьшено с 6 до 3
        const spread = (Math.random() - 0.5) * weapon.spread;
        const finalAngle = angle + spread;
        const speed = weapon.bulletSpeed * (0.8 + Math.random() * 0.4); // уменьшен разброс скорости

        state.bullets.push(
          new Bullet(
            this.x + Math.cos(finalAngle) * this.radius,
            this.y + Math.sin(finalAngle) * this.radius,
            Math.cos(finalAngle) * speed,
            Math.sin(finalAngle) * speed,
            weapon,
          ),
        );
      }
      
      // автоматическая перезарядка для огнемёта
      if (this.magazine === 0 && !this.reloading) {
        this.reload(now);
      }
    } else {
      // тратим патрон для обычного оружия
      this.magazine--;
      
      // обычное оружие
      const spread = (Math.random() - 0.5) * weapon.spread;
      const finalAngle = angle + spread;
      const speed = weapon.bulletSpeed;

      state.bullets.push(
        new Bullet(
          this.x + Math.cos(finalAngle) * this.radius,
          this.y + Math.sin(finalAngle) * this.radius,
          Math.cos(finalAngle) * speed,
          Math.sin(finalAngle) * speed,
          weapon, // передаём данные оружия для урона
        ),
      );
      
      // автоматическая перезарядка для обычного оружия
      if (this.magazine === 0 && !this.reloading) {
        this.reload(now);
      }
    }

    // muzzle flash particles
    for (let i = 0; i < 4; i++) {
      const finalAngle = angle + (Math.random() - 0.5) * 0.2;
      state.particles.push(
        new Particle(
          this.x,
          this.y,
          Math.cos(finalAngle) * (2 + Math.random() * 2),
          Math.sin(finalAngle) * (2 + Math.random() * 2),
          80 + Math.random() * 60,
          "rgba(255, 255, 255, 0.9)",
        ),
      );
    }
  }

  reload(now) {
    if (this.reloading || this.magazine === this.maxMagazine) return;
    this.reloading = true;
    this.reloadStartTime = now;
  }

  checkReload(now) {
    if (!this.reloading) return;
    if (now - this.reloadStartTime >= this.reloadTime) {
      this.magazine = this.maxMagazine;
      this.reloading = false;
      this.reloadStartTime = 0;
    }
  }

  draw() {
    const stats = PLAYER_STATS;
    // Рисуем солдата вместо простого круга
    this.drawSoldierSprite();

    // визуализация щита
    if (state.playerShield > 0) {
      const shieldAlpha = 0.3 + Math.sin(performance.now() / 100) * 0.2;
      const shieldGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.5);
      shieldGradient.addColorStop(0, `rgba(74, 144, 226, ${shieldAlpha})`);
      shieldGradient.addColorStop(1, `rgba(74, 144, 226, 0)`);
      ctx.fillStyle = shieldGradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // контур щита
      ctx.strokeStyle = `rgba(74, 144, 226, ${shieldAlpha + 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Оружие рисуется в drawSoldierSprite


    // health bar
    const healthBarWidth = 80;
    const healthBarHeight = 6;
    const healthX = this.x - healthBarWidth / 2;
    const healthY = this.y - this.radius - 20;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(healthX, healthY, healthBarWidth, healthBarHeight);

    const healthRatio = this.hp / this.maxHp;
    // цвет здоровья меняется от салатового к красному при потере HP
    const healthColor =
      healthRatio > 0.6
        ? "#9fff7f" // салатовый цвет, чтобы отличался от бирюзового индикатора патронов
        : healthRatio > 0.3
          ? "#ffcc00"
          : "#ff476e";
    ctx.fillStyle = healthColor;
    ctx.fillRect(healthX, healthY, healthBarWidth * healthRatio, healthBarHeight);

    // ammo bar
    if (this.weapon) {
      const barWidth = 80;
      const barHeight = 6;
      const x = this.x - barWidth / 2;
      const y = this.y + this.radius + 16;

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(x, y, barWidth, barHeight);

      const ratio = this.magazine / this.maxMagazine;
      ctx.fillStyle = this.reloading ? "#ffcc00" : "#0fffd2";
      ctx.fillRect(x, y, barWidth * ratio, barHeight);
    }
  }

  drawSoldierSprite() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const stats = PLAYER_STATS;
    const size = this.radius * 2;
    const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
    
    // Свечение вокруг солдата
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.2);
    gradient.addColorStop(0, stats.glowColor);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Тело солдата (торс)
    ctx.fillStyle = "#2c3e50"; // тёмно-синий/серый цвет формы
    ctx.fillRect(-size * 0.25, -size * 0.2, size * 0.5, size * 0.6);
    
    // Голова солдата (шлем)
    ctx.fillStyle = "#34495e";
    ctx.beginPath();
    ctx.arc(0, -size * 0.4, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Визор шлема
    ctx.fillStyle = "#1a252f";
    ctx.fillRect(-size * 0.15, -size * 0.45, size * 0.3, size * 0.1);
    
    // Руки солдата
    ctx.fillStyle = "#2c3e50";
    // Левая рука
    ctx.fillRect(-size * 0.35, -size * 0.1, size * 0.15, size * 0.4);
    // Правая рука (держит оружие)
    ctx.fillRect(size * 0.2, -size * 0.1, size * 0.15, size * 0.4);
    
    // Ноги солдата
    ctx.fillStyle = "#1a252f"; // тёмные штаны
    ctx.fillRect(-size * 0.2, size * 0.4, size * 0.18, size * 0.35);
    ctx.fillRect(size * 0.02, size * 0.4, size * 0.18, size * 0.35);
    
    // Ботинки
    ctx.fillStyle = "#000000";
    ctx.fillRect(-size * 0.25, size * 0.75, size * 0.2, size * 0.1);
    ctx.fillRect(size * 0.05, size * 0.75, size * 0.2, size * 0.1);
    
    // Разгрузка/бронежилет
    ctx.strokeStyle = "#34495e";
    ctx.lineWidth = 2;
    ctx.strokeRect(-size * 0.25, -size * 0.2, size * 0.5, size * 0.4);
    
    // Оружие в руках (поворачивается к мыши)
    ctx.save();
    ctx.rotate(angle);
    this.drawWeaponSprite(size);
    ctx.restore();
    
    ctx.restore();
  }

  drawWeaponSprite(size) {
    // Если активна бластерная пушка, показываем её вместо обычного оружия
    if (state.laserCannon > 0) {
      const weaponLength = size * 0.7;
      const weaponX = size * 0.3;
      const weaponY = 0;
      
      // Бластерная пушка
      ctx.fillStyle = "#00ffff";
      ctx.fillRect(weaponX, weaponY - size * 0.08, weaponLength * 0.6, size * 0.16);
      // Энергетический блок
      ctx.fillStyle = "#0088ff";
      ctx.fillRect(weaponX + weaponLength * 0.6, weaponY - size * 0.1, weaponLength * 0.4, size * 0.2);
      // Прицел
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(weaponX + weaponLength * 0.7, weaponY, size * 0.05, 0, Math.PI * 2);
      ctx.stroke();
      // Энергетическое свечение
      const glowGradient = ctx.createRadialGradient(
        weaponX + weaponLength * 0.7, weaponY,
        0,
        weaponX + weaponLength * 0.7, weaponY,
        size * 0.15
      );
      glowGradient.addColorStop(0, "rgba(0, 255, 255, 0.6)");
      glowGradient.addColorStop(1, "rgba(0, 255, 255, 0)");
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(weaponX + weaponLength * 0.7, weaponY, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    
    const weapon = this.weapon;
    if (!weapon) return;
    
    const weaponLength = size * 0.6;
    const weaponX = size * 0.3;
    const weaponY = 0;
    
    // Определяем тип оружия и рисуем соответствующий скин
    if (weapon.name === "Пистолет") {
      // Пистолет
      ctx.fillStyle = "#654321"; // коричневый
      ctx.fillRect(weaponX, weaponY - size * 0.05, weaponLength * 0.4, size * 0.1);
      ctx.fillStyle = "#333333"; // тёмно-серый
      ctx.fillRect(weaponX + weaponLength * 0.4, weaponY - size * 0.06, weaponLength * 0.3, size * 0.12);
      // Рукоятка
      ctx.fillStyle = "#8b4513";
      ctx.fillRect(weaponX, weaponY, weaponLength * 0.25, size * 0.08);
    } else if (weapon.name === "Дробовик") {
      // Дробовик
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(weaponX, weaponY - size * 0.08, weaponLength * 0.5, size * 0.16);
      // Ствол
      ctx.fillStyle = "#1a252f";
      ctx.fillRect(weaponX + weaponLength * 0.5, weaponY - size * 0.06, weaponLength * 0.4, size * 0.12);
      // Приклад
      ctx.fillStyle = "#654321";
      ctx.fillRect(weaponX - size * 0.1, weaponY - size * 0.04, size * 0.15, size * 0.08);
    } else if (weapon.name === "Миниган") {
      // Миниган
      ctx.fillStyle = "#34495e";
      ctx.fillRect(weaponX, weaponY - size * 0.1, weaponLength * 0.6, size * 0.2);
      // Стволы
      ctx.fillStyle = "#1a252f";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(weaponX + weaponLength * 0.7 + i * size * 0.05, weaponY, size * 0.03, 0, Math.PI * 2);
        ctx.fill();
      }
      // Ручка
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(weaponX + weaponLength * 0.3, weaponY + size * 0.05, size * 0.1, size * 0.15);
    } else if (weapon.name === "Бластер") {
    } else if (weapon.name === "Ракетница") {
      // Ракетница
      ctx.fillStyle = "#34495e";
      ctx.fillRect(weaponX, weaponY - size * 0.1, weaponLength * 0.4, size * 0.2);
      // Труба запуска
      ctx.fillStyle = "#1a252f";
      ctx.fillRect(weaponX + weaponLength * 0.4, weaponY - size * 0.08, weaponLength * 0.5, size * 0.16);
      // Прицел
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(weaponX + weaponLength * 0.3, weaponY - size * 0.12);
      ctx.lineTo(weaponX + weaponLength * 0.35, weaponY - size * 0.15);
      ctx.stroke();
    } else if (weapon.name === "Огнемёт") {
      // Огнемёт
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(weaponX, weaponY - size * 0.08, weaponLength * 0.5, size * 0.16);
      // Бак с топливом
      ctx.fillStyle = "#ff6600";
      ctx.fillRect(weaponX - size * 0.1, weaponY - size * 0.06, size * 0.15, size * 0.12);
      // Сопло
      ctx.fillStyle = "#1a252f";
      ctx.fillRect(weaponX + weaponLength * 0.5, weaponY - size * 0.06, weaponLength * 0.4, size * 0.12);
    } else {
      // Дефолтное оружие (автомат)
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(weaponX, weaponY - size * 0.06, weaponLength * 0.6, size * 0.12);
      // Ствол
      ctx.fillStyle = "#1a252f";
      ctx.fillRect(weaponX + weaponLength * 0.6, weaponY - size * 0.05, weaponLength * 0.3, size * 0.1);
      // Приклад
      ctx.fillStyle = "#654321";
      ctx.fillRect(weaponX - size * 0.08, weaponY - size * 0.04, size * 0.12, size * 0.08);
    }
    
    // Эффект выстрела (muzzle flash)
    if (mouse.down && ((state.laserCannon > 0) || (!this.reloading && this.magazine > 0))) {
      const flashSize = size * 0.15;
      const flashGradient = ctx.createRadialGradient(
        weaponX + weaponLength * 0.9, weaponY,
        0,
        weaponX + weaponLength * 0.9, weaponY,
        flashSize
      );
      flashGradient.addColorStop(0, "rgba(255, 255, 200, 0.9)");
      flashGradient.addColorStop(0.5, "rgba(255, 200, 0, 0.5)");
      flashGradient.addColorStop(1, "rgba(255, 100, 0, 0)");
      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(weaponX + weaponLength * 0.9, weaponY, flashSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

class Bullet {
  constructor(x, y, vx, vy, weaponData = null) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 4;
    this.alive = true;
    this.weaponData = weaponData; // данные оружия для взрывного оружия
    this.gravity = 0; // гравитация для дуговой траектории
    this.lifetime = 0;
    this.maxLifetime = 0; // максимальное время жизни (для огнемёта)
    this.piercing = weaponData && weaponData.piercing; // пробивающая пуля
    this.hitTargets = []; // список целей (врагов/боссов), которых уже пробила пуля
    if (weaponData && weaponData.arc) {
      this.gravity = 0.3; // гравитация для гранатомёта
      this.radius = 6;
    }
    if (weaponData && weaponData.explosive) {
      this.radius = 8;
    }
    if (weaponData && weaponData.piercing) {
      this.radius = 10; // больший размер для бластерной пушки
    }
    if (weaponData && weaponData.isFlame) {
      this.maxLifetime = 2000; // 2 секунды для огнемёта
    }
  }

  update(dt) {
    this.lifetime += dt * 16; // умножаем на 16 для перевода в миллисекунды
    
    // пули из огнемёта исчезают через 2 секунды
    if (this.maxLifetime > 0 && this.lifetime >= this.maxLifetime) {
      this.alive = false;
      return;
    }
    
    // гравитация для дуговой траектории
    if (this.gravity > 0) {
      this.vy += this.gravity * dt;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -20 || this.x > WIDTH + 20 || this.y < -20 || this.y > HEIGHT + 20) {
      // взрыв при выходе за границы для взрывного оружия
      if (this.weaponData && this.weaponData.explosive) {
        this.explode();
      }
      this.alive = false;
    }
  }

  explode() {
    if (!this.weaponData || !this.weaponData.explosive) return;
    const explosionRadius = this.weaponData.explosionRadius || 60;
    
    // создаём анимацию взрыва
    state.explosions = state.explosions || [];
    state.explosions.push(new ExplosionAnimation(this.x, this.y, explosionRadius));
    
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < explosionRadius + enemy.radius) {
        enemy.hp -= 5; // увеличен взрывной урон
        if (enemy.hp <= 0) {
          enemy.alive = false;
          state.score += 10 + state.wave * 2;
          scoreEl.textContent = state.score;

          if (enemy.canDropGold && Math.random() < 0.3) {
            const goldAmount = Math.random() < 0.15 ? 50 : 10;
            state.gold.push(new Gold(enemy.x, enemy.y, goldAmount));
          }
          
          if (state.wave >= 3 && enemy.canDropMedkit && Math.random() < 0.25) {
            state.medkits.push(new Medkit(enemy.x, enemy.y));
          }
        }
      }
    }
    
    // взрыв также действует на боссов
    for (const boss of state.bosses) {
      if (!boss.alive) continue;
      const dist = Math.hypot(boss.x - this.x, boss.y - this.y);
      if (dist < explosionRadius + boss.radius) {
        boss.hit(5); // увеличен взрывной урон боссу
      }
    }

    // визуальный эффект взрыва
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      state.particles.push(
        new Particle(
          this.x,
          this.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          150 + Math.random() * 150,
          "rgba(255, 150, 0, 0.9)",
        ),
      );
    }
  }

  draw() {
    if (this.piercing) {
      // Бластерная пушка - мощный пробивающий заряд
      const laserGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
      laserGradient.addColorStop(0, "rgba(0, 255, 255, 0.95)");
      laserGradient.addColorStop(0.5, "rgba(0, 200, 255, 0.7)");
      laserGradient.addColorStop(1, "rgba(0, 150, 255, 0)");
      ctx.fillStyle = laserGradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Яркое ядро
      ctx.fillStyle = "#00ffff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Свечение вокруг
      ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.weaponData && this.weaponData.isFlame) {
      // огнемёт - огненные частицы (уменьшенный радиус)
      const flameRadius = this.radius * 0.5; // еще уменьшен радиус поражения
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, flameRadius);
      gradient.addColorStop(0, "rgba(255, 100, 0, 0.7)");
      gradient.addColorStop(0.5, "rgba(255, 200, 0, 0.4)");
      gradient.addColorStop(1, "rgba(255, 50, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, flameRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff4400";
    } else if (this.weaponData && this.weaponData.explosive) {
      ctx.fillStyle = "#ff6600";
    } else if (this.weaponData && this.weaponData.arc) {
      ctx.fillStyle = "#ffaa00";
    } else {
      ctx.fillStyle = "#fffbcc";
    }
    if (!this.piercing) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

class EnemyBullet {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.alive = true;
    this.damage = 10;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -20 || this.x > WIDTH + 20 || this.y < -20 || this.y > HEIGHT + 20) {
      this.alive = false;
    }
  }

  draw() {
    // цвет как у огнемета
    ctx.fillStyle = "#ff4400";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // свечение как у огнемета
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
    gradient.addColorStop(0, "rgba(255, 100, 0, 0.7)");
    gradient.addColorStop(0.5, "rgba(255, 200, 0, 0.4)");
    gradient.addColorStop(1, "rgba(255, 50, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Enemy {
  constructor(x, y, type, speedMultiplier = 1) {
    this.x = x;
    this.y = y;
    this.type = type; // "zombie", "alien", "spider"
    this.alive = true;
    this.animationFrame = 0; // для анимации зомби
    this.animationTime = 0;

    // базовые параметры по типу врага, вдохновлённые Crimsonland:
    // - зомби: медленные и слабые, но массой
    // - пауки: маленькие, быстрые
    // - алиены: чуть быстрее и плотнее обычных
    // - стрелок: стреляет в игрока
    // - танк: медленный, много HP
    // - бегун: очень быстрый, мало HP
    if (type === "zombie") {
      this.radius = 16;
      this.baseSpeed = 0.9;
      this.maxHp = 2;
      this.damage = 18; // увеличенный урон для зелёных
      this.bodyColor = "#6fd66b";
      this.glowColor = "rgba(150, 255, 150, 0.9)";
      this.canShoot = false;
    } else if (type === "spider") {
      this.radius = 10;
      this.baseSpeed = 1.7;
      this.maxHp = 1;
      this.damage = 8; // уменьшенный урон для жёлтых
      this.bodyColor = "#f8b84a";
      this.glowColor = "rgba(255, 200, 120, 0.9)";
      this.canShoot = false;
    } else if (type === "shooter") {
      this.radius = 12;
      this.baseSpeed = 0.8;
      this.maxHp = 3;
      this.damage = 15;
      this.bodyColor = "#9b59b6";
      this.glowColor = "rgba(155, 89, 182, 0.9)";
      this.canShoot = true;
      this.shootDelay = 2000; // стреляет раз в 2 секунды
      this.lastShot = 0;
    } else if (type === "tank") {
      this.radius = 20;
      this.baseSpeed = 0.5;
      this.maxHp = 10;
      this.damage = 25;
      this.bodyColor = "#34495e";
      this.glowColor = "rgba(52, 73, 94, 0.9)";
      this.canShoot = false;
    } else if (type === "runner") {
      this.radius = 8;
      this.baseSpeed = 2.5;
      this.maxHp = 1;
      this.damage = 10;
      this.bodyColor = "#e74c3c";
      this.glowColor = "rgba(231, 76, 60, 0.9)";
      this.canShoot = false;
    } else {
      // alien по умолчанию
      this.radius = 14;
      this.baseSpeed = 1.3;
      this.maxHp = 6; // в 2 раза больше здоровья (было 3)
      this.damage = 22; // самый сильный урон
      this.bodyColor = "#ff476e";
      this.glowColor = "rgba(255, 70, 110, 0.9)";
      this.canShoot = false;
    }

    // скорость: учитываем волну (враги становятся быстрее с каждой волной, кроме жёлтых)
    const waveSpeedBonus = 1 + (state.wave - 1) * 0.03; // +3% за каждую волну
    
    if (this.type === "zombie") {
      // зелёные (zombie) стали немного быстрее базовой скорости
      this.speed = this.baseSpeed * speedMultiplier * 1.2 * waveSpeedBonus;
    } else if (this.type === "spider") {
      // жёлтые (spider) - скорость не увеличивается с волнами
      this.speed = this.baseSpeed * speedMultiplier * 1.5;
    } else if (this.type === "shooter") {
      // стрелок - средняя скорость, увеличивается с волнами
      this.speed = this.baseSpeed * speedMultiplier * waveSpeedBonus;
    } else if (this.type === "tank") {
      // танк - медленный, увеличивается с волнами
      this.speed = this.baseSpeed * speedMultiplier * waveSpeedBonus;
    } else if (this.type === "runner") {
      // бегун - очень быстрый, не увеличивается с волнами (уже очень быстрый)
      this.speed = this.baseSpeed * speedMultiplier;
    } else {
      // алиены теперь медленнее, но с большим здоровьем
      this.speed = this.baseSpeed * speedMultiplier * 0.9 * waveSpeedBonus;
    }
    
    this.hp = this.maxHp;
    this.speedBoost = 0; // таймер ускорения для красных врагов
    this.speedBoostActive = false;
    // инициализация для стреляющих врагов
    if (!this.canShoot) {
      this.lastShot = 0;
    }
    
    // шанс выпадения золота: у красных врагов, стрелков и танков выше
    if (this.type === "alien") {
      this.canDropGold = Math.random() < 0.6; // 60% шанс для красных врагов
    } else if (this.type === "shooter" || this.type === "tank") {
      this.canDropGold = Math.random() < 0.4; // 40% шанс для стрелков и танков
    } else {
      this.canDropGold = Math.random() < 0.15; // 15% шанс для остальных
    }
    // шанс выпадения аптечки с любого врага (только после 3 волны)
    this.canDropMedkit = Math.random() < 0.06; // 6% шанс (уменьшено)
  }

  update(dt) {
    if (!state.player) return;
    
    // анимация для всех врагов
    this.animationTime += dt * 16;
    const animationSpeed = this.type === "runner" ? 150 : this.type === "spider" ? 180 : 200;
    if (this.animationTime > animationSpeed) {
      this.animationFrame = (this.animationFrame + 1) % 4;
      this.animationTime = 0;
    }
    
    // заморозка врагов
    if (state.enemiesFrozen > 0) {
      return; // враги не двигаются
    }
    
    // ускорение для красных врагов (вероятность растёт к концу волны)
    if (this.type === "alien" && !this.speedBoostActive) {
      // вероятность увеличивается к концу волны (когда врагов мало)
      const enemiesLeft = state.enemies.filter(e => e.alive).length;
      const totalEnemies = state.enemyQueue.length + enemiesLeft;
      const waveProgress = totalEnemies > 0 ? 1 - (enemiesLeft / Math.max(1, totalEnemies)) : 0;
      const boostChance = 0.01 + waveProgress * 0.05; // от 1% до 6%
      
      if (Math.random() < boostChance * dt) {
        this.speedBoostActive = true;
        this.speedBoost = 2000; // 2 секунды
      }
    }
    
    // обновление таймера ускорения
    if (this.speedBoostActive) {
      this.speedBoost -= dt * 16;
      if (this.speedBoost <= 0) {
        this.speedBoostActive = false;
      }
    }
    
    const angle = Math.atan2(state.player.y - this.y, state.player.x - this.x);
    
    // стрельба для стреляющих врагов
    if (this.canShoot) {
      const now = performance.now();
      if (now - this.lastShot >= this.shootDelay) {
        // стреляем в игрока
        const bulletSpeed = 4.0;
        const dist = Math.hypot(state.player.x - this.x, state.player.y - this.y);
        if (dist < 600) { // стреляем только если игрок в пределах 600px
          state.enemyBullets.push(
            new EnemyBullet(
              this.x,
              this.y,
              Math.cos(angle) * bulletSpeed,
              Math.sin(angle) * bulletSpeed,
            ),
          );
          this.lastShot = now;
          
          // визуальный эффект выстрела
          for (let i = 0; i < 5; i++) {
            const partAngle = angle + (Math.random() - 0.5) * 0.2;
            state.particles.push(
              new Particle(
                this.x,
                this.y,
                Math.cos(partAngle) * (2 + Math.random() * 2),
                Math.sin(partAngle) * (2 + Math.random() * 2),
                100 + Math.random() * 100,
                "rgba(155, 89, 182, 0.9)",
              ),
            );
          }
        }
      }
    }
    
    const currentSpeed = this.speed * (this.speedBoostActive ? 1.3 : 1); // +30% при ускорении
    this.x += Math.cos(angle) * currentSpeed * dt;
    this.y += Math.sin(angle) * currentSpeed * dt;
  }

  hit(damage = 1) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.alive = false;
      
      createEnemyDeathEffect(this);
    }
  }

  draw() {
    // эффект ускорения для красных врагов
    if (this.type === "alien" && this.speedBoostActive) {
      const boostGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3);
      boostGradient.addColorStop(0, "rgba(255, 255, 0, 0.5)");
      boostGradient.addColorStop(1, "rgba(255, 255, 0, 0)");
      ctx.fillStyle = boostGradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // эффект заморозки
    if (state.enemiesFrozen > 0) {
      const freezeGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.5);
      freezeGradient.addColorStop(0, "rgba(78, 205, 196, 0.6)");
      freezeGradient.addColorStop(1, "rgba(78, 205, 196, 0)");
      ctx.fillStyle = freezeGradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Рисуем спрайты для разных типов врагов
    if (this.type === "zombie") {
      this.drawZombieSprite();
    } else if (this.type === "spider") {
      this.drawSpiderSprite();
    } else if (this.type === "alien") {
      this.drawAlienSprite();
    } else if (this.type === "shooter") {
      this.drawShooterSprite();
    } else if (this.type === "tank") {
      this.drawTankSprite();
    } else if (this.type === "runner") {
      this.drawRunnerSprite();
    } else {
      // Для остальных - обычные круги (fallback)
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
      gradient.addColorStop(0, this.glowColor);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.bodyColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawZombieSprite() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const size = this.radius * 2;
    
    // Свечение вокруг зомби
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    glowGradient.addColorStop(0, this.glowColor);
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Если есть загруженный спрайт, используем его (без поворота)
    if (zombieSprite && zombieSprite.complete) {
      const spriteSize = size * 1.2; // немного больше для лучшей видимости
      ctx.drawImage(
        zombieSprite,
        -spriteSize / 2,
        -spriteSize / 2,
        spriteSize,
        spriteSize
      );
    } else {
      // Иначе рисуем программно созданный спрайт (вертикально)
      
      const bodyWidth = size * 0.6;
      const bodyHeight = size * 0.8;
      const headSize = size * 0.5;
      
      // Тело зомби (прямоугольник)
      ctx.fillStyle = "#6fd66b"; // зеленый цвет
      ctx.fillRect(-bodyWidth / 2, -bodyHeight / 2 + headSize / 2, bodyWidth, bodyHeight);
      
      // Голова зомби (круг)
      ctx.fillStyle = "#8bcc88"; // светло-зеленый
      ctx.beginPath();
      ctx.arc(0, -bodyHeight / 2 + headSize / 2, headSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Глаза зомби (два черных круга)
      ctx.fillStyle = "#000000";
      const eyeOffset = headSize * 0.15;
      ctx.beginPath();
      ctx.arc(-eyeOffset, -bodyHeight / 2 + headSize / 2 - headSize * 0.1, headSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeOffset, -bodyHeight / 2 + headSize / 2 - headSize * 0.1, headSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // Рот зомби (полумесяц)
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -bodyHeight / 2 + headSize / 2 + headSize * 0.1, headSize * 0.2, 0, Math.PI);
      ctx.stroke();
      
      // Руки зомби (две линии)
      const armLength = size * 0.4;
      const armSwing = Math.sin(this.animationFrame * Math.PI / 2) * 0.3; // анимация качания рук
      ctx.strokeStyle = "#6fd66b";
      ctx.lineWidth = size * 0.15;
      ctx.lineCap = "round";
      
      // Левая рука
      ctx.beginPath();
      ctx.moveTo(-bodyWidth / 2, -bodyHeight / 2 + headSize / 2 + size * 0.2);
      ctx.lineTo(-bodyWidth / 2 - armLength * Math.cos(armSwing), -bodyHeight / 2 + headSize / 2 + size * 0.2 + armLength * Math.sin(armSwing));
      ctx.stroke();
      
      // Правая рука
      ctx.beginPath();
      ctx.moveTo(bodyWidth / 2, -bodyHeight / 2 + headSize / 2 + size * 0.2);
      ctx.lineTo(bodyWidth / 2 + armLength * Math.cos(armSwing), -bodyHeight / 2 + headSize / 2 + size * 0.2 + armLength * Math.sin(armSwing));
      ctx.stroke();
      
      // Ноги зомби (две линии)
      const legLength = size * 0.35;
      const legSwing = Math.sin(this.animationFrame * Math.PI / 2 + Math.PI) * 0.2;
      ctx.strokeStyle = "#5ab85a"; // темнее для ног
      ctx.lineWidth = size * 0.12;
      
      // Левая нога
      ctx.beginPath();
      ctx.moveTo(-bodyWidth / 3, bodyHeight / 2);
      ctx.lineTo(-bodyWidth / 3 + legSwing * legLength, bodyHeight / 2 + legLength);
      ctx.stroke();
      
      // Правая нога
      ctx.beginPath();
      ctx.moveTo(bodyWidth / 3, bodyHeight / 2);
      ctx.lineTo(bodyWidth / 3 - legSwing * legLength, bodyHeight / 2 + legLength);
      ctx.stroke();
      
      // Одежда зомби (рваная рубашка)
      ctx.strokeStyle = "#4a9a4a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-bodyWidth / 2, -bodyHeight / 2 + headSize / 2 + size * 0.15);
      ctx.lineTo(bodyWidth / 2, -bodyHeight / 2 + headSize / 2 + size * 0.15);
      ctx.stroke();
      
      // Кровь/грязь на зомби (несколько пятен)
      ctx.fillStyle = "#8b0000"; // темно-красный
      ctx.beginPath();
      ctx.arc(-bodyWidth / 4, bodyHeight / 4, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bodyWidth / 3, -bodyHeight / 6, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawSpiderSprite() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Паук всегда вертикальный (без поворота)
    
    const size = this.radius * 2;
    
    // Свечение
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    glowGradient.addColorStop(0, this.glowColor);
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Тело паука (овал)
    ctx.fillStyle = "#f8b84a"; // жёлтый
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Голова паука (меньший овал)
    ctx.fillStyle = "#ffd700"; // золотистый
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.15, size * 0.25, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза паука (8 глаз)
    ctx.fillStyle = "#000000";
    const eyePositions = [
      [-size * 0.1, -size * 0.2], [size * 0.1, -size * 0.2],
      [-size * 0.15, -size * 0.15], [size * 0.15, -size * 0.15],
      [-size * 0.1, -size * 0.1], [size * 0.1, -size * 0.1],
      [-size * 0.05, -size * 0.05], [size * 0.05, -size * 0.05]
    ];
    eyePositions.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Лапы паука (8 лап)
    ctx.strokeStyle = "#f8b84a";
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = "round";
    const legLength = size * 0.5;
    const legSwing = Math.sin(this.animationFrame * Math.PI / 2) * 0.4;
    
    for (let i = 0; i < 8; i++) {
      const legAngle = (i / 8) * Math.PI * 2;
      const legX = Math.cos(legAngle) * size * 0.3;
      const legY = Math.sin(legAngle) * size * 0.3;
      const endX = legX + Math.cos(legAngle + legSwing) * legLength;
      const endY = legY + Math.sin(legAngle + legSwing) * legLength;
      
      ctx.beginPath();
      ctx.moveTo(legX, legY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  drawAlienSprite() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const size = this.radius * 2;
    
    // Свечение
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    glowGradient.addColorStop(0, this.glowColor);
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Демон всегда вертикальный (без поворота)
    
    // Тело демона/крипера (вытянутый овал)
    ctx.fillStyle = "#ff476e"; // красный
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.35, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Голова (треугольная форма)
    ctx.fillStyle = "#ff6b8a";
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.lineTo(-size * 0.25, -size * 0.2);
    ctx.lineTo(size * 0.25, -size * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // Глаза (светящиеся красные)
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.35, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.1, -size * 0.35, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Рот (злой)
    ctx.strokeStyle = "#8b0000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -size * 0.25, size * 0.1, 0, Math.PI);
    ctx.stroke();
    
    // Руки (крючковатые)
    ctx.strokeStyle = "#ff476e";
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = "round";
    const armSwing = Math.sin(this.animationFrame * Math.PI / 2) * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.1);
    ctx.lineTo(-size * 0.5 - armSwing * size * 0.2, size * 0.1 + armSwing * size * 0.2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(size * 0.3, -size * 0.1);
    ctx.lineTo(size * 0.5 + armSwing * size * 0.2, size * 0.1 + armSwing * size * 0.2);
    ctx.stroke();
    
    // Ноги
    ctx.strokeStyle = "#ff476e";
    ctx.lineWidth = size * 0.1;
    const legSwing = Math.sin(this.animationFrame * Math.PI / 2 + Math.PI) * 0.2;
    
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, size * 0.4);
    ctx.lineTo(-size * 0.2 + legSwing * size * 0.1, size * 0.6);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(size * 0.15, size * 0.4);
    ctx.lineTo(size * 0.2 - legSwing * size * 0.1, size * 0.6);
    ctx.stroke();
    
    // Шипы на спине
    ctx.fillStyle = "#cc0033";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.1 + i * size * 0.1, -size * 0.3);
      ctx.lineTo(-size * 0.05 + i * size * 0.1, -size * 0.5);
      ctx.lineTo(0 + i * size * 0.1, -size * 0.3);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawShooterSprite() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Скелет всегда вертикальный (без поворота)
    
    const size = this.radius * 2;
    
    // Свечение
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    glowGradient.addColorStop(0, this.glowColor);
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Тело скелета (прямоугольник)
    ctx.fillStyle = "#9b59b6"; // фиолетовый
    ctx.fillRect(-size * 0.25, -size * 0.3, size * 0.5, size * 0.6);
    
    // Голова (череп)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -size * 0.4, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Глазницы
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(-size * 0.08, -size * 0.4, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.08, -size * 0.4, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Арбалет в руках
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = size * 0.08;
    ctx.beginPath();
    ctx.moveTo(size * 0.3, -size * 0.1);
    ctx.lineTo(size * 0.5, -size * 0.1);
    ctx.stroke();
    
    // Лук арбалета
    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = size * 0.06;
    ctx.beginPath();
    ctx.arc(size * 0.5, -size * 0.1, size * 0.15, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
    
    // Руки
    ctx.strokeStyle = "#9b59b6";
    ctx.lineWidth = size * 0.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-size * 0.25, -size * 0.1);
    ctx.lineTo(-size * 0.4, size * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.25, -size * 0.1);
    ctx.lineTo(size * 0.4, size * 0.1);
    ctx.stroke();
    
    // Ноги
    ctx.strokeStyle = "#9b59b6";
    ctx.lineWidth = size * 0.1;
    const legSwing = Math.sin(this.animationFrame * Math.PI / 2 + Math.PI) * 0.2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, size * 0.3);
    ctx.lineTo(-size * 0.15 + legSwing * size * 0.1, size * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.1, size * 0.3);
    ctx.lineTo(size * 0.15 - legSwing * size * 0.1, size * 0.5);
    ctx.stroke();
    
    ctx.restore();
  }

  drawTankSprite() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const size = this.radius * 2;
    
    // Свечение
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    glowGradient.addColorStop(0, this.glowColor);
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Голем всегда вертикальный (без поворота)
    
    // Тело голема (большой прямоугольник)
    ctx.fillStyle = "#34495e"; // тёмно-серый
    ctx.fillRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);
    
    // Каменная текстура
    ctx.fillStyle = "#2c3e50";
    for (let i = 0; i < 5; i++) {
      const x = -size * 0.3 + Math.random() * size * 0.6;
      const y = -size * 0.3 + Math.random() * size * 0.6;
      ctx.fillRect(x, y, size * 0.1, size * 0.1);
    }
    
    // Голова (квадратная)
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(-size * 0.25, -size * 0.5, size * 0.5, size * 0.3);
    
    // Глаза (светящиеся)
    ctx.fillStyle = "#3498db";
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.4, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.1, -size * 0.4, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Руки (каменные)
    ctx.fillStyle = "#34495e";
    ctx.fillRect(-size * 0.5, -size * 0.2, size * 0.2, size * 0.4);
    ctx.fillRect(size * 0.3, -size * 0.2, size * 0.2, size * 0.4);
    
    // Ноги (тяжёлые)
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(-size * 0.3, size * 0.4, size * 0.25, size * 0.3);
    ctx.fillRect(size * 0.05, size * 0.4, size * 0.25, size * 0.3);
    
    // Броня/пластины
    ctx.strokeStyle = "#1a252f";
    ctx.lineWidth = 2;
    ctx.strokeRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);
    ctx.strokeRect(-size * 0.25, -size * 0.5, size * 0.5, size * 0.3);
    
    ctx.restore();
  }

  drawRunnerSprite() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Имп всегда вертикальный (без поворота)
    
    const size = this.radius * 2;
    
    // Свечение
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    glowGradient.addColorStop(0, this.glowColor);
    glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Тело импа (маленький треугольник)
    ctx.fillStyle = "#e74c3c"; // красный
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.3);
    ctx.lineTo(-size * 0.2, size * 0.2);
    ctx.lineTo(size * 0.2, size * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // Голова (маленький круг)
    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    ctx.arc(0, -size * 0.3, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (светящиеся красные точки)
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(-size * 0.05, -size * 0.3, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.05, -size * 0.3, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
    
    // Рога
    ctx.strokeStyle = "#8b0000";
    ctx.lineWidth = size * 0.05;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, -size * 0.4);
    ctx.lineTo(-size * 0.15, -size * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.1, -size * 0.4);
    ctx.lineTo(size * 0.15, -size * 0.5);
    ctx.stroke();
    
    // Руки (быстрые движения)
    ctx.strokeStyle = "#e74c3c";
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = "round";
    const armSwing = Math.sin(this.animationFrame * Math.PI) * 0.5; // быстрая анимация
    
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, 0);
    ctx.lineTo(-size * 0.3 - armSwing * size * 0.2, size * 0.1 + Math.abs(armSwing) * size * 0.2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(size * 0.15, 0);
    ctx.lineTo(size * 0.3 + armSwing * size * 0.2, size * 0.1 + Math.abs(armSwing) * size * 0.2);
    ctx.stroke();
    
    // Ноги (быстрый бег)
    ctx.strokeStyle = "#c0392b";
    ctx.lineWidth = size * 0.08;
    const legSwing = Math.sin(this.animationFrame * Math.PI) * 0.4;
    
    ctx.beginPath();
    ctx.moveTo(-size * 0.08, size * 0.2);
    ctx.lineTo(-size * 0.12 + legSwing * size * 0.15, size * 0.4);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(size * 0.08, size * 0.2);
    ctx.lineTo(size * 0.12 - legSwing * size * 0.15, size * 0.4);
    ctx.stroke();
    
    // Хвост
    ctx.strokeStyle = "#8b0000";
    ctx.lineWidth = size * 0.06;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.2);
    ctx.quadraticCurveTo(size * 0.1, size * 0.3, size * 0.15, size * 0.35);
    ctx.stroke();
    
    ctx.restore();
  }
}

class Particle {
  constructor(x, y, vx, vy, life, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= 16 * dt;
  }

  draw() {
    if (this.life <= 0) return;
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = this.color.replace(/0\.\d+\)/, `${alpha.toFixed(2)})`);
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Gold {
  constructor(x, y, amount = 10) {
    this.x = x;
    this.y = y;
    this.radius = 8;
    this.amount = amount; // количество золота (10 или 50)
    this.collected = false;
    this.pulse = 0;
  }

  update(dt) {
    this.pulse += dt * 10;
    // притягивание к игроку (увеличена скорость)
    if (state.player) {
      const dist = Math.hypot(this.x - state.player.x, this.y - state.player.y);
      if (dist < 80) { // увеличен радиус притягивания
        const angle = Math.atan2(state.player.y - this.y, state.player.x - this.x);
        this.x += Math.cos(angle) * 6 * dt; // увеличена скорость с 3 до 6
        this.y += Math.sin(angle) * 6 * dt;
      }
      if (dist < this.radius + state.player.radius) {
        this.collected = true;
        const multiplier = getCheckinGoldMultiplier();
        const adjustedAmount = Math.max(1, Math.round(this.amount * multiplier));
        state.goldAmount += adjustedAmount;
        goldEl.textContent = state.goldAmount;
        setStoredArcadeGold(state.goldAmount);
        const bonusPercent = Math.round((multiplier - 1) * 100);
        const bonusLabel = bonusPercent > 0 ? ` (+${bonusPercent}%)` : "";
        // уведомление
        state.notifications.push(new Notification(this.x, this.y, `+${adjustedAmount}💰${bonusLabel}`));
      }
    }
  }

  draw() {
    const glowSize = 12 + Math.sin(this.pulse) * 2;
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
    gradient.addColorStop(0, "rgba(255, 215, 0, 0.9)");
    gradient.addColorStop(0.5, "rgba(255, 215, 0, 0.4)");
    gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // значок доллара
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", this.x, this.y);
  }
}

class Medkit {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.collected = false;
    this.pulse = 0;
  }

  update(dt) {
    this.pulse += dt * 8;
    // притягивание к игроку (увеличена скорость)
    if (state.player) {
      const dist = Math.hypot(this.x - state.player.x, this.y - state.player.y);
      if (dist < 80) { // увеличен радиус притягивания
        const angle = Math.atan2(state.player.y - this.y, state.player.x - this.x);
        this.x += Math.cos(angle) * 6 * dt; // увеличена скорость с 3 до 6
        this.y += Math.sin(angle) * 6 * dt;
      }
      if (dist < this.radius + state.player.radius) {
        this.collected = true;
        // восстанавливаем 25% здоровья
        const healAmount = Math.floor(state.player.maxHp * 0.25);
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);
        hpEl.textContent = state.player.hp;
        // уведомление
        state.notifications.push(new Notification(this.x, this.y, `+${healAmount} HP`));
      }
    }
  }

  draw() {
    const glowSize = 14 + Math.sin(this.pulse) * 2;
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
    gradient.addColorStop(0, "rgba(255, 50, 50, 0.9)");
    gradient.addColorStop(0.5, "rgba(255, 50, 50, 0.4)");
    gradient.addColorStop(1, "rgba(255, 50, 50, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // фон
    ctx.fillStyle = "#ff3232";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // белый крест аптечки
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 3;
    
    // вертикальная линия
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 8);
    ctx.lineTo(this.x, this.y + 8);
    ctx.stroke();
    
    // горизонтальная линия
    ctx.beginPath();
    ctx.moveTo(this.x - 8, this.y);
    ctx.lineTo(this.x + 8, this.y);
    ctx.stroke();
  }
}

class Bonus {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // "freeze", "explosion", "speed"
    this.radius = 12;
    this.collected = false;
    this.pulse = 0;
    this.lifetime = 15000; // время жизни в миллисекундах (15 секунд)
    this.maxLifetime = 15000;
    this.spawnTime = performance.now();
  }

  update(dt) {
    this.pulse += dt * 10;
    const now = performance.now();
    this.lifetime = this.maxLifetime - (now - this.spawnTime);
    
    if (this.lifetime <= 0) {
      this.collected = true;
      return;
    }

    // без притягивания - игрок должен подойти сам
    if (state.player) {
      const dist = Math.hypot(this.x - state.player.x, this.y - state.player.y);
      if (dist < this.radius + state.player.radius) {
        this.collected = true;
        this.activate();
      }
    }
  }

  activate() {
    if (this.type === "freeze") {
      // заморозка всех врагов на 3 секунды
      state.enemiesFrozen = 3000;
      state.notifications.push(new Notification(this.x, this.y, "❄ Заморозка!"));
    } else if (this.type === "explosion") {
      // взрыв с большим уроном (радиус уменьшен в 2 раза)
      const explosionRadius = 300;
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (dist < explosionRadius + enemy.radius) {
          enemy.hp -= 5; // большой урон
          if (enemy.hp <= 0) {
            enemy.alive = false;
            state.score += 10 + state.wave * 2;
            scoreEl.textContent = state.score;

            // шанс выпадения золота
            if (enemy.canDropGold && Math.random() < 0.3) {
              const goldAmount = Math.random() < 0.15 ? 50 : 10;
              state.gold.push(new Gold(enemy.x, enemy.y, goldAmount));
            }
          }
        }
      }
      // взрыв также действует на боссов
      for (const boss of state.bosses) {
        if (!boss.alive) continue;
        const dist = Math.hypot(boss.x - this.x, boss.y - this.y);
        if (dist < explosionRadius + boss.radius) {
          boss.hit(5); // большой урон боссу
        }
      }
      // создаём анимацию взрыва на весь радиус
      state.explosions = state.explosions || [];
      state.explosions.push(new ExplosionAnimation(this.x, this.y, explosionRadius));
      
      // визуальный эффект взрыва
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 5;
        state.particles.push(
          new Particle(
            this.x,
            this.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            250 + Math.random() * 250,
            "rgba(255, 200, 0, 0.9)",
          ),
        );
      }
    } else if (this.type === "speed") {
      // повышение скорости игрока на 15 секунд
      state.playerSpeedBoost = 15000;
      state.notifications.push(new Notification(this.x, this.y, "⚡ Ускорение!"));
    } else if (this.type === "shield") {
      // щит - неуязвимость на 15 секунд
      state.playerShield = 15000;
      state.notifications.push(new Notification(this.x, this.y, "🛡 Щит!"));
    } else if (this.type === "laser") {
      // Бластерная пушка на 20 секунд
      state.laserCannon = 20000;
      state.notifications.push(new Notification(this.x, this.y, "⚡ Бластерная пушка!"));
    }
  }

  draw() {
    const timeRatio = this.lifetime / this.maxLifetime;
    const glowSize = 16 + Math.sin(this.pulse) * 3;
    
    // цвет в зависимости от типа
    let color, glowColor;
    if (this.type === "freeze") {
      color = "#4ecdc4";
      glowColor = "rgba(78, 205, 196, 0.9)";
    } else if (this.type === "explosion") {
      color = "#ffaa00";
      glowColor = "rgba(255, 170, 0, 0.9)";
    } else if (this.type === "shield") {
      color = "#4a90e2";
      glowColor = "rgba(74, 144, 226, 0.9)";
    } else if (this.type === "laser") {
      color = "#00ffff";
      glowColor = "rgba(0, 255, 255, 0.9)";
    } else {
      color = "#9fff7f";
      glowColor = "rgba(159, 255, 127, 0.9)";
    }

    // внешнее свечение
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(0.5, glowColor.replace("0.9", "0.4"));
    gradient.addColorStop(1, glowColor.replace("0.9", "0"));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // таймер вокруг бонуса
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeRatio);
    ctx.stroke();

    // тело бонуса
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // иконка
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (this.type === "freeze") {
      ctx.fillText("❄", this.x, this.y);
    } else if (this.type === "explosion") {
      ctx.fillText("💥", this.x, this.y);
    } else if (this.type === "shield") {
      ctx.fillText("🛡", this.x, this.y);
    } else if (this.type === "laser") {
      ctx.fillText("⚡", this.x, this.y);
    } else {
      ctx.fillText("⚡", this.x, this.y);
    }
  }
}

class ExplosionAnimation {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.maxRadius = radius;
    this.life = 1.0;
    this.speed = 0.15;
    this.alive = true;
  }

  update(dt) {
    this.life -= dt * this.speed;
    this.radius = this.maxRadius * (1 - this.life);
    if (this.life <= 0) {
      this.alive = false;
    }
  }

  draw() {
    if (this.life <= 0) return;
    const alpha = this.life;
    
    // внешнее кольцо взрыва
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.maxRadius);
    gradient.addColorStop(0, `rgba(255, 200, 0, ${alpha * 0.8})`);
    gradient.addColorStop(0.3, `rgba(255, 150, 0, ${alpha * 0.6})`);
    gradient.addColorStop(0.6, `rgba(255, 100, 0, ${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.maxRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // внутренний круг
    ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.9})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // контур взрыва
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

class WeaponPickup {
  constructor(x, y, weaponKey) {
    this.x = x;
    this.y = y;
    this.weaponKey = weaponKey;
    this.weapon = WEAPONS[weaponKey];
    this.radius = 14;
    this.collected = false;
    this.pulse = 0;
    this.lifetime = 20000; // 20 секунд
    this.maxLifetime = 20000;
    this.spawnTime = performance.now();
  }

  update(dt) {
    this.pulse += dt * 8;
    const now = performance.now();
    this.lifetime = this.maxLifetime - (now - this.spawnTime);
    
    if (this.lifetime <= 0) {
      this.collected = true;
      return;
    }

    // без притягивания - игрок должен подойти сам
    if (state.player) {
      const dist = Math.hypot(this.x - state.player.x, this.y - state.player.y);
      if (dist < this.radius + state.player.radius) {
        this.collected = true;
        state.currentWeapon = this.weaponKey;
        // обновляем оружие игрока
        if (state.player) {
          const weapon = WEAPONS[this.weaponKey];
          state.player.weapon = weapon;
          state.player.fireDelay = weapon.fireDelay / (1 + state.upgrades.fireRate / 100);
          state.player.reloadTime = weapon.reloadTime / (PLAYER_STATS.baseReloadSpeed * (1 + state.upgrades.reloadSpeed / 100));
          state.player.magazine = weapon.magazine;
          state.player.maxMagazine = weapon.maxMagazine;
        }
        // уведомление
        state.notifications.push(new Notification(this.x, this.y, `Оружие: ${this.weapon.name}`));
      }
    }
  }

  draw() {
    const timeRatio = this.lifetime / this.maxLifetime;
    const glowSize = 18 + Math.sin(this.pulse) * 3;
    
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
    gradient.addColorStop(0, "rgba(100, 200, 255, 0.9)");
    gradient.addColorStop(0.5, "rgba(100, 200, 255, 0.4)");
    gradient.addColorStop(1, "rgba(100, 200, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // таймер
    ctx.strokeStyle = "#64c8ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeRatio);
    ctx.stroke();

    // тело
    ctx.fillStyle = "#64c8ff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // единый значок оружия сверху
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚔", this.x, this.y - this.radius - 8);
    
    // изображение оружия на иконке
    ctx.font = "bold 16px Arial";
    const icon = this.getWeaponIcon();
    ctx.fillText(icon, this.x, this.y);
  }

  getWeaponIcon() {
    const icons = {
      pistol: "🔫",
      minigun: "⚙️",
      rocket_launcher: "🚀",
      flamethrower: "🔥",
    };
    return icons[this.weaponKey] || "⚔";
  }
}

class Notification {
  constructor(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.life = 2000; // 2 секунды
    this.maxLife = 2000;
    this.vy = -1; // движение вверх
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt * 16;
  }

  draw() {
    if (this.life <= 0) return;
    const alpha = Math.min(1, this.life / 500);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
    ctx.lineWidth = 3;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
  }
}

class BloodStain {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 8 + Math.random() * 12;
    this.rotation = Math.random() * Math.PI * 2;
    this.opacity = 0.6 + Math.random() * 0.3;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = `rgba(150, 0, 0, ${this.opacity})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Boss {
  constructor(x, y, wave) {
    this.x = x;
    this.y = y;
    this.wave = wave;
    this.radius = 50 + wave * 3; // увеличенный размер босса
    this.maxHp = 50 + wave * 15; // здоровье растёт с волной
    this.hp = this.maxHp;
    this.speed = 1.2 + wave * 0.1;
    this.alive = true;
    this.damage = 30 + wave * 5;
    this.shootDelay = 1500 - wave * 50; // стреляет быстрее с волной
    this.lastShot = 0;
    this.lastCircularShot = 0; // время последнего кругового выстрела
    this.circularShotDelay = 2000 - wave * 100; // задержка кругового выстрела (чем сложнее - тем чаще)
    this.pulse = 0;
    this.spawnCount = 0; // количество спавнов быстрых врагов
    this.maxSpawns = 3; // максимум 3 спавна за жизнь
    // Определяем тип босса в зависимости от волны
    this.bossType = Math.floor((wave - 1) / 3) % 4; // 0-3 типов боссов
    this.setBossAppearance();
  }

  setBossAppearance() {
    // Разные скины для разных боссов
    if (this.bossType === 0) {
      // Босс 1: Демон-разрушитель
      this.color = "#ff0066";
      this.glowColor = "rgba(255, 0, 102, 0.9)";
      this.secondaryColor = "#cc0033";
    } else if (this.bossType === 1) {
      // Босс 2: Ледяной титан
      this.color = "#4ecdc4";
      this.glowColor = "rgba(78, 205, 196, 0.9)";
      this.secondaryColor = "#2a9d94";
    } else if (this.bossType === 2) {
      // Босс 3: Огненный дракон
      this.color = "#ff6600";
      this.glowColor = "rgba(255, 102, 0, 0.9)";
      this.secondaryColor = "#cc4400";
    } else {
      // Босс 4: Теневой лорд
      this.color = "#6c3483";
      this.glowColor = "rgba(108, 52, 131, 0.9)";
      this.secondaryColor = "#4a235a";
    }
  }

  update(dt) {
    if (!state.player || !this.alive) return;
    
    this.pulse += dt * 8;
    
    // заморозка боссов
    if (state.enemiesFrozen > 0) {
      return; // боссы не двигаются и не стреляют при заморозке
    }
    
    // движение к игроку
    const angle = Math.atan2(state.player.y - this.y, state.player.x - this.x);
    this.x += Math.cos(angle) * this.speed * dt;
    this.y += Math.sin(angle) * this.speed * dt;
    
    const now = performance.now();
    
    // стрельба вокруг себя (чем сложнее босс - тем чаще)
    if (now - this.lastCircularShot >= this.circularShotDelay) {
      const bulletSpeed = 5.0;
      const bulletCount = 8; // стреляем 8 пулями вокруг
      for (let i = 0; i < bulletCount; i++) {
        const shootAngle = (Math.PI * 2 / bulletCount) * i;
        state.enemyBullets.push(
          new EnemyBullet(
            this.x,
            this.y,
            Math.cos(shootAngle) * bulletSpeed,
            Math.sin(shootAngle) * bulletSpeed,
          ),
        );
      }
      this.lastCircularShot = now;
      
      // визуальный эффект выстрела
      for (let i = 0; i < 12; i++) {
        const partAngle = (Math.PI * 2 / 12) * i;
        state.particles.push(
          new Particle(
            this.x,
            this.y,
            Math.cos(partAngle) * (3 + Math.random() * 2),
            Math.sin(partAngle) * (3 + Math.random() * 2),
            150 + Math.random() * 150,
            "rgba(255, 0, 102, 0.9)",
          ),
        );
      }
    }
    
    // стрельба в игрока (старая логика, оставляем для разнообразия)
    if (now - this.lastShot >= this.shootDelay) {
      const bulletSpeed = 5.0;
      const dist = Math.hypot(state.player.x - this.x, state.player.y - this.y);
      if (dist < 800) {
        // стреляем 3 пулями веером
        for (let i = -1; i <= 1; i++) {
          const shootAngle = angle + i * 0.3;
          state.enemyBullets.push(
            new EnemyBullet(
              this.x,
              this.y,
              Math.cos(shootAngle) * bulletSpeed,
              Math.sin(shootAngle) * bulletSpeed,
            ),
          );
        }
        this.lastShot = now;
      }
    }
    
    // спавн быстрых врагов (runner) - рандомно, но не больше 3 раз
    if (this.spawnCount < this.maxSpawns && Math.random() < 0.001) {
      // спавним пачку из 5 быстрых врагов
      for (let i = 0; i < 5; i++) {
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnDist = this.radius + 30;
        const spawnX = this.x + Math.cos(spawnAngle) * spawnDist;
        const spawnY = this.y + Math.sin(spawnAngle) * spawnDist;
        
        // проверяем, что спавн в пределах карты
        if (spawnX > 50 && spawnX < WIDTH - 50 && spawnY > 50 && spawnY < HEIGHT - 50) {
          state.enemies.push(new Enemy(spawnX, spawnY, "runner", 1));
        }
      }
      this.spawnCount++;
    }
  }

  hit(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.alive = false;
      // создаём эффект смерти босса
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        state.particles.push(
          new Particle(
            this.x,
            this.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            300 + Math.random() * 300,
            "rgba(255, 0, 102, 0.9)",
          ),
        );
      }
      
      // награда за убийство босса
      state.score += 100 + this.wave * 50;
      scoreEl.textContent = state.score;
      
      // Выпадает 100 золота и аптечка
      state.gold.push(new Gold(this.x, this.y, 100));
      state.medkits.push(new Medkit(this.x + 30, this.y));
      
      // создаём чекпоинт
      if (state.gameMode === "arcade") {
        state.checkpoints.push({
          wave: this.wave,
          score: state.score,
          gold: state.goldAmount,
          upgrades: JSON.parse(JSON.stringify(state.upgrades)),
        });
      }
      
      state.bossDefeated = true; // отмечаем, что босс убит
      state.notifications.push(new Notification(this.x, this.y, "Босс побеждён!"));
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const size = this.radius * 2;
    const pulseSize = 1 + Math.sin(this.pulse) * 0.05;
    
    // Внешнее свечение
    const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
    outerGradient.addColorStop(0, this.glowColor);
    outerGradient.addColorStop(0.5, this.glowColor.replace("0.9", "0.4"));
    outerGradient.addColorStop(1, this.glowColor.replace("0.9", "0"));
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Рисуем разные скины в зависимости от типа босса
    if (this.bossType === 0) {
      this.drawDemonBoss(size * pulseSize);
    } else if (this.bossType === 1) {
      this.drawIceTitanBoss(size * pulseSize);
    } else if (this.bossType === 2) {
      this.drawFireDragonBoss(size * pulseSize);
    } else {
      this.drawShadowLordBoss(size * pulseSize);
    }
    
    ctx.restore();
    
    // Полоска здоровья
    const healthBarWidth = this.radius * 2.5;
    const healthBarHeight = 10;
    const healthX = this.x - healthBarWidth / 2;
    const healthY = this.y - this.radius - 35;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(healthX - 2, healthY - 2, healthBarWidth + 4, healthBarHeight + 4);
    
    const healthRatio = this.hp / this.maxHp;
    ctx.fillStyle = healthRatio > 0.5 ? this.color : healthRatio > 0.25 ? "#ff6600" : "#ff0000";
    ctx.fillRect(healthX, healthY, healthBarWidth * healthRatio, healthBarHeight);
    
    // эффект заморозки для боссов
    if (state.enemiesFrozen > 0) {
      const freezeGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 1.5);
      freezeGradient.addColorStop(0, "rgba(78, 205, 196, 0.6)");
      freezeGradient.addColorStop(1, "rgba(78, 205, 196, 0)");
      ctx.fillStyle = freezeGradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Текст "BOSS"
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeText("BOSS", this.x, this.y);
    ctx.fillText("BOSS", this.x, this.y);
  }

  drawDemonBoss(size) {
    // Демон-разрушитель - большой рогатый демон
    // Тело
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Голова
    ctx.fillStyle = this.secondaryColor;
    ctx.beginPath();
    ctx.arc(0, -size * 0.4, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Рога
    ctx.fillStyle = "#8b0000";
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, -size * 0.5);
    ctx.lineTo(-size * 0.25, -size * 0.7);
    ctx.lineTo(-size * 0.1, -size * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.15, -size * 0.5);
    ctx.lineTo(size * 0.25, -size * 0.7);
    ctx.lineTo(size * 0.1, -size * 0.65);
    ctx.closePath();
    ctx.fill();
    
    // Глаза
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.4, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.1, -size * 0.4, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Руки с когтями
    ctx.fillStyle = this.color;
    ctx.fillRect(-size * 0.5, -size * 0.2, size * 0.25, size * 0.4);
    ctx.fillRect(size * 0.25, -size * 0.2, size * 0.25, size * 0.4);
    
    // Крылья
    ctx.fillStyle = this.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(-size * 0.5, 0, size * 0.3, size * 0.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.5, 0, size * 0.3, size * 0.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawIceTitanBoss(size) {
    // Ледяной титан - большой ледяной голем
    // Тело
    ctx.fillStyle = this.color;
    ctx.fillRect(-size * 0.35, -size * 0.4, size * 0.7, size * 0.8);
    
    // Ледяные кристаллы на теле
    ctx.fillStyle = this.secondaryColor;
    for (let i = 0; i < 6; i++) {
      const x = -size * 0.3 + (i % 3) * size * 0.3;
      const y = -size * 0.3 + Math.floor(i / 3) * size * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size * 0.05, y - size * 0.08);
      ctx.lineTo(x + size * 0.1, y);
      ctx.lineTo(x + size * 0.05, y + size * 0.08);
      ctx.closePath();
      ctx.fill();
    }
    
    // Голова
    ctx.fillStyle = this.secondaryColor;
    ctx.beginPath();
    ctx.arc(0, -size * 0.5, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза
    ctx.fillStyle = "#00ffff";
    ctx.beginPath();
    ctx.arc(-size * 0.08, -size * 0.5, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.08, -size * 0.5, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Руки
    ctx.fillStyle = this.color;
    ctx.fillRect(-size * 0.45, -size * 0.2, size * 0.2, size * 0.5);
    ctx.fillRect(size * 0.25, -size * 0.2, size * 0.2, size * 0.5);
    
    // Ноги
    ctx.fillStyle = this.secondaryColor;
    ctx.fillRect(-size * 0.3, size * 0.4, size * 0.25, size * 0.3);
    ctx.fillRect(size * 0.05, size * 0.4, size * 0.25, size * 0.3);
  }

  drawFireDragonBoss(size) {
    // Огненный дракон - дракон с огненной аурой
    // Тело
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.35, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Голова дракона
    ctx.fillStyle = this.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.45, size * 0.25, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Пасть
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(0, -size * 0.4, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза
    ctx.fillStyle = "#ffff00";
    ctx.beginPath();
    ctx.arc(-size * 0.08, -size * 0.5, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.08, -size * 0.5, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Крылья
    ctx.fillStyle = this.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(-size * 0.4, -size * 0.1, size * 0.25, size * 0.4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.4, -size * 0.1, size * 0.25, size * 0.4, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Хвост
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.5, size * 0.2, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Огненная аура
    const fireGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.6);
    fireGradient.addColorStop(0, "rgba(255, 200, 0, 0.3)");
    fireGradient.addColorStop(1, "rgba(255, 100, 0, 0)");
    ctx.fillStyle = fireGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawShadowLordBoss(size) {
    // Теневой лорд - тёмный призрачный босс
    // Тело (призрачное)
    const shadowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.4);
    shadowGradient.addColorStop(0, this.color);
    shadowGradient.addColorStop(0.5, this.secondaryColor);
    shadowGradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Голова
    ctx.fillStyle = this.secondaryColor;
    ctx.beginPath();
    ctx.arc(0, -size * 0.3, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза (светящиеся фиолетовые)
    ctx.fillStyle = "#9b59b6";
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.3, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.1, -size * 0.3, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Руки (призрачные)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(-size * 0.4, 0, size * 0.15, size * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.4, 0, size * 0.15, size * 0.3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Теневые щупальца
    ctx.strokeStyle = this.secondaryColor;
    ctx.lineWidth = size * 0.08;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * size * 0.3, Math.sin(angle) * size * 0.3);
      ctx.lineTo(Math.cos(angle) * size * 0.5, Math.sin(angle) * size * 0.5);
      ctx.stroke();
    }
  }
}

function createEnemyDeathEffect(enemy) {
  // унифицированный эффект смерти врага
  for (let i = 0; i < 10; i++) {
    const speed = 1 + Math.random() * 2;
    const partAngle = Math.random() * Math.PI * 2;
    state.particles.push(
      new Particle(
        enemy.x,
        enemy.y,
        Math.cos(partAngle) * speed,
        Math.sin(partAngle) * speed,
        260 + Math.random() * 280,
        enemy.type === "zombie"
          ? "rgba(150, 255, 150, 0.85)"
          : enemy.type === "spider"
            ? "rgba(255, 200, 120, 0.85)"
            : enemy.type === "shooter"
              ? "rgba(155, 89, 182, 0.85)"
              : enemy.type === "tank"
                ? "rgba(52, 73, 94, 0.85)"
                : enemy.type === "runner"
                  ? "rgba(231, 76, 60, 0.85)"
                  : "rgba(255, 70, 110, 0.85)",
      ),
    );
  }
}

function generateSpawnPoints() {
  // генерируем 3 рандомные точки спауна на карте (не слишком близко к краям и центру)
  state.spawnPoints = [];
  const margin = 100;
  for (let i = 0; i < 3; i++) {
    state.spawnPoints.push({
      x: margin + Math.random() * (WIDTH - margin * 2),
      y: margin + Math.random() * (HEIGHT - margin * 2),
    });
  }
}

function getWaveComposition(wave) {
  // лёгкие первые волны и постепенное наращивание сложности:
  // зомби -> пауки -> алиены -> стрелки -> танки -> бегуны
  if (wave === 1) return [{ type: "zombie", count: 6 }];
  if (wave === 2) return [{ type: "zombie", count: 10 }];
  if (wave === 3) return [{ type: "zombie", count: 10 }, { type: "spider", count: 4 }];
  if (wave === 4) return [{ type: "zombie", count: 10 }, { type: "spider", count: 8 }];
  if (wave === 5) return [{ type: "zombie", count: 12 }, { type: "spider", count: 8 }, { type: "alien", count: 3 }];
  if (wave === 6) return [{ type: "zombie", count: 10 }, { type: "spider", count: 8 }, { type: "alien", count: 4 }, { type: "shooter", count: 2 }];
  if (wave === 7) return [{ type: "zombie", count: 12 }, { type: "spider", count: 10 }, { type: "alien", count: 5 }, { type: "shooter", count: 3 }];
  if (wave === 8) return [{ type: "zombie", count: 10 }, { type: "spider", count: 8 }, { type: "alien", count: 4 }, { type: "shooter", count: 4 }, { type: "tank", count: 1 }];
  if (wave === 9) return [{ type: "zombie", count: 12 }, { type: "spider", count: 10 }, { type: "alien", count: 5 }, { type: "shooter", count: 5 }, { type: "tank", count: 2 }, { type: "runner", count: 3 }];
  if (wave === 10) return [{ type: "zombie", count: 10 }, { type: "spider", count: 8 }, { type: "alien", count: 6 }, { type: "shooter", count: 6 }, { type: "tank", count: 2 }, { type: "runner", count: 5 }];

  // дальше — формула, растущая по количеству и доле «сложных» врагов
  const baseCount = 10 + wave * 3;
  const alienCount = Math.floor(wave / 2);
  const spiderCount = Math.floor(wave * 1.2);
  const shooterCount = Math.floor(wave / 3);
  const tankCount = Math.floor(wave / 5);
  const runnerCount = Math.floor(wave / 4);
  const zombieCount = Math.max(6, baseCount - alienCount - spiderCount - shooterCount - tankCount - runnerCount);

  return [
    { type: "zombie", count: zombieCount },
    { type: "spider", count: spiderCount },
    { type: "alien", count: alienCount },
    { type: "shooter", count: shooterCount },
    { type: "tank", count: tankCount },
    { type: "runner", count: runnerCount },
  ];
}

function getSpawnPosition() {
  // рандомно выбираем: либо из точки спауна на карте, либо с краёв
  const useSpawnPoint = Math.random() < 0.5 && state.spawnPoints.length > 0;

  if (useSpawnPoint) {
    // спаун из одной из 3 рандомных точек на карте
    const point = state.spawnPoints[Math.floor(Math.random() * state.spawnPoints.length)];
    return { x: point.x, y: point.y };
  } else {
    // спаун с краёв карты (как раньше)
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) {
      x = -20;
      y = Math.random() * HEIGHT;
    } else if (edge === 1) {
      x = WIDTH + 20;
      y = Math.random() * HEIGHT;
    } else if (edge === 2) {
      x = Math.random() * WIDTH;
      y = -20;
    } else {
      x = Math.random() * WIDTH;
      y = HEIGHT + 20;
    }
    return { x, y };
  }
}

function spawnEnemyWave() {
  // очищаем очередь и заполняем её врагами для постепенного спауна
  state.enemyQueue = [];
  const composition = getWaveComposition(state.wave);

  for (const group of composition) {
    // увеличиваем количество врагов на волне в 3 раза
    for (let i = 0; i < group.count * 3; i++) {
      const speedMult = 1 + state.wave * 0.06 + Math.random() * 0.25;
      state.enemyQueue.push({
        type: group.type,
        speedMult: speedMult,
      });
    }
  }

  // перемешиваем очередь для рандомного порядка спауна
  for (let i = state.enemyQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.enemyQueue[i], state.enemyQueue[j]] = [state.enemyQueue[j], state.enemyQueue[i]];
  }

  state.lastSpawnTime = performance.now();
}

function spawnBonus() {
  // спаун бонуса в случайном месте на карте
  const margin = 100;
  const x = margin + Math.random() * (WIDTH - margin * 2);
  const y = margin + Math.random() * (HEIGHT - margin * 2);
  
  const types = ["freeze", "explosion", "speed", "shield", "laser"];
  const type = types[Math.floor(Math.random() * types.length)];
  
  state.bonuses.push(new Bonus(x, y, type));
}

function spawnWeapon() {
  // спаун оружия в случайном месте на карте
  const margin = 100;
  const x = margin + Math.random() * (WIDTH - margin * 2);
  const y = margin + Math.random() * (HEIGHT - margin * 2);
  
  // исключаем пистолет, бластер (теперь это бонус) и оружие, которое у игрока
  const availableWeapons = Object.keys(WEAPONS).filter(key => 
    key !== "pistol" && key !== state.currentWeapon
  );
  
  if (availableWeapons.length === 0) return; // нет доступного оружия
  
  const weaponKey = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
  
  state.weapons.push(new WeaponPickup(x, y, weaponKey));
}

function resetGame(checkpoint = null) {
  state.running = true;
  state.paused = false;
  state.player = new Player();
  state.bullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.bosses = [];
  state.particles = [];
  state.gold = [];
  state.medkits = [];
  state.bonuses = [];
  state.weapons = [];
  state.explosions = [];
  state.notifications = [];
  state.bloodStains = [];
  state.playerSpeedBoost = 0;
  state.enemiesFrozen = 0;
  state.laserCannon = 0;
  state.spawnTimer = 0;
  state.enemyQueue = [];
  state.lastSpawnTime = 0;
  state.currentWeapon = "pistol"; // всегда начинаем с пистолета
  state.bossDefeated = false;
  state.waveCompleteMessage = null;

  // Если выбран чекпоинт, загружаем данные из него
  if (checkpoint) {
    state.wave = checkpoint.wave;
    state.score = checkpoint.score;
    state.goldAmount = checkpoint.gold;
    state.upgrades = JSON.parse(JSON.stringify(checkpoint.upgrades));
    setStoredArcadeGold(state.goldAmount);
    // Обновляем игрока с улучшениями из чекпоинта
    state.player.maxHp = PLAYER_STATS.maxHp + state.upgrades.maxHp;
    state.player.hp = state.player.maxHp;
    state.player.speed = PLAYER_STATS.baseSpeed * (1 + state.upgrades.moveSpeed / 100);
    // Всегда начинаем с пистолета, даже из чекпоинта
    state.currentWeapon = "pistol";
    const weapon = WEAPONS.pistol;
    state.player.weapon = weapon;
    state.player.fireDelay = weapon.fireDelay / (1 + state.upgrades.fireRate / 100);
    state.player.reloadTime = weapon.reloadTime / (PLAYER_STATS.baseReloadSpeed * (1 + state.upgrades.reloadSpeed / 100));
    state.player.magazine = weapon.magazine;
    state.player.maxMagazine = weapon.maxMagazine;
  } else {
    state.score = 0;
    state.wave = 1;
    state.goldAmount = state.gameMode === "arcade" ? getStoredArcadeGold() : 0;
    state.upgrades = {
      maxHp: 0,
      reloadSpeed: 0,
      fireRate: 0,
      moveSpeed: 0,
    };
  }

  generateSpawnPoints();
  spawnEnemyWave();

  hpEl.textContent = state.player.hp;
  scoreEl.textContent = state.score;
  waveEl.textContent = state.wave;
  goldEl.textContent = state.goldAmount;
}

function endGame() {
  state.running = false;
  finalScoreEl.textContent = state.score;
  finalWaveEl.textContent = state.wave;
  addLeaderboardEntry(state.score, state.wave, state.gameMode);
  renderLeaderboard();
  gameOverEl.classList.remove("hidden");
}

function update(dt, now) {
  if (!state.running) return;

  state.player.update(dt);
  state.player.checkReload(now); // проверка завершения перезарядки

  if (mouse.down) {
    state.player.shoot(now);
  }

  state.bullets.forEach((b) => b.update(dt));
  state.bullets = state.bullets.filter((b) => b.alive);

  state.enemyBullets.forEach((b) => b.update(dt));
  state.enemyBullets = state.enemyBullets.filter((b) => b.alive);

  state.enemies.forEach((e) => e.update(dt));

  // collisions bullets ↔ enemyBullets (самоуничтожение)
  for (const bullet of state.bullets) {
    if (!bullet.alive) continue;
    for (const enemyBullet of state.enemyBullets) {
      if (!enemyBullet.alive) continue;
      const dist = Math.hypot(bullet.x - enemyBullet.x, bullet.y - enemyBullet.y);
      if (dist < bullet.radius + enemyBullet.radius) {
        bullet.alive = false;
        enemyBullet.alive = false;
        // визуальный эффект столкновения
        for (let i = 0; i < 5; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 2;
          state.particles.push(
            new Particle(
              bullet.x,
              bullet.y,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              100 + Math.random() * 100,
              "rgba(255, 255, 255, 0.9)",
            ),
          );
        }
        break;
      }
    }
  }

  // collisions bullets ↔ enemies
  for (const bullet of state.bullets) {
    if (!bullet.alive) continue;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      // Проверяем, не пробила ли уже эта пуля этого врага (для пробивающих пуль)
      if (bullet.piercing && bullet.hitTargets.includes(enemy)) continue;
      
      const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
      if (dist < enemy.radius + bullet.radius) {
        // взрывное оружие взрывается при попадании
        if (bullet.weaponData && bullet.weaponData.explosive) {
          bullet.explode();
          bullet.alive = false;
        } else if (bullet.weaponData && bullet.weaponData.isFlame) {
          // огнемёт - уменьшенный урон
          bullet.alive = false;
          enemy.hp -= bullet.weaponData.damage || 0.5;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            state.score += 10 + state.wave * 2;
            scoreEl.textContent = state.score;

            if (enemy.canDropGold && Math.random() < 0.3) {
              const goldAmount = Math.random() < 0.15 ? 50 : 10;
              state.gold.push(new Gold(enemy.x, enemy.y, goldAmount));
            }
            
            if (state.wave >= 3 && enemy.canDropMedkit && Math.random() < 0.25) {
              state.medkits.push(new Medkit(enemy.x, enemy.y));
            }

            createEnemyDeathEffect(enemy);
          }
        } else if (bullet.piercing) {
          // Пробивающая пуля (бластерная пушка) - не останавливается, наносит урон и продолжает полет
          const damage = bullet.weaponData ? (bullet.weaponData.damage || 3) : 3;
          enemy.hit(damage);
          bullet.hitTargets.push(enemy); // отмечаем, что этот враг уже пробит
          
          // Визуальный эффект попадания
          for (let i = 0; i < 5; i++) {
            const partAngle = Math.random() * Math.PI * 2;
            state.particles.push(
              new Particle(
                enemy.x,
                enemy.y,
                Math.cos(partAngle) * (2 + Math.random()),
                Math.sin(partAngle) * (2 + Math.random()),
                100 + Math.random() * 100,
                "rgba(0, 255, 255, 0.95)",
              ),
            );
          }
          
          if (!enemy.alive) {
            state.score += 10 + state.wave * 2;
            scoreEl.textContent = state.score;

            if (enemy.canDropGold && Math.random() < 0.3) {
              const goldAmount = Math.random() < 0.15 ? 50 : 10;
              state.gold.push(new Gold(enemy.x, enemy.y, goldAmount));
            }
            
            if (state.wave >= 3 && enemy.canDropMedkit && Math.random() < 0.25) {
              state.medkits.push(new Medkit(enemy.x, enemy.y));
            }

            createEnemyDeathEffect(enemy);
          }
          // Пуля продолжает полет, не останавливается
        } else {
          bullet.alive = false;
          // используем урон оружия, если он передан через bullet
          const damage = bullet.weaponData ? (bullet.weaponData.damage || 1) : 1;
          enemy.hit(damage);
          if (!enemy.alive) {
            state.score += 10 + state.wave * 2;
            scoreEl.textContent = state.score;

            // шанс выпадения золота (10 или 50)
            if (enemy.canDropGold && Math.random() < 0.3) {
              const goldAmount = Math.random() < 0.15 ? 50 : 10; // 15% шанс на 50, иначе 10
              state.gold.push(new Gold(enemy.x, enemy.y, goldAmount));
            }
            
            // шанс выпадения аптечки (только после 3 волны)
            if (state.wave >= 3 && enemy.canDropMedkit && Math.random() < 0.25) {
              state.medkits.push(new Medkit(enemy.x, enemy.y));
            }
          }
        }
        if (!bullet.piercing) break; // обычные пули останавливаются после первого попадания
      }
    }
  }
  state.enemies = state.enemies.filter((e) => e.alive);

  // enemyBullets ↔ enemies (вражеские пули могут попадать в других врагов)
  for (const bullet of state.enemyBullets) {
    if (!bullet.alive) continue;
    for (const enemy of state.enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
      if (dist < bullet.radius + enemy.radius) {
        bullet.alive = false;
        // наносим урон врагу (такой же как игроку)
        enemy.hp -= bullet.damage;
        if (enemy.hp <= 0) {
          enemy.alive = false;
          state.score += 10 + state.wave * 2;
          scoreEl.textContent = state.score;

          if (enemy.canDropGold && Math.random() < 0.3) {
            const goldAmount = Math.random() < 0.15 ? 50 : 10;
            state.gold.push(new Gold(enemy.x, enemy.y, goldAmount));
          }
          
          if (state.wave >= 3 && enemy.canDropMedkit && Math.random() < 0.25) {
            state.medkits.push(new Medkit(enemy.x, enemy.y));
          }

          createEnemyDeathEffect(enemy);
        }
        break; // пуля исчезает после попадания
      }
    }
  }
  
  // enemyBullets ↔ player
  for (const bullet of state.enemyBullets) {
    if (!bullet.alive) continue;
    const dist = Math.hypot(bullet.x - state.player.x, bullet.y - state.player.y);
    if (dist < bullet.radius + state.player.radius) {
      bullet.alive = false;
      // проверка щита
      if (state.playerShield <= 0) {
        state.player.hp -= bullet.damage;
        hpEl.textContent = Math.max(0, state.player.hp);
      }
      
      // визуальный эффект попадания
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        state.particles.push(
          new Particle(
            state.player.x,
            state.player.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            200 + Math.random() * 200,
            "rgba(255, 107, 107, 0.8)",
          ),
        );
      }
      
      if (state.player.hp <= 0) {
        endGame();
        return;
      }
    }
  }
  state.enemyBullets = state.enemyBullets.filter((b) => b.alive);

  // enemies ↔ player
  for (const enemy of state.enemies) {
    const dist = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
    if (dist < enemy.radius + state.player.radius - 4) {
      // проверка щита
      if (state.playerShield <= 0) {
        state.player.hp -= enemy.damage; // урон зависит от типа врага
        hpEl.textContent = Math.max(0, state.player.hp);
      }
      enemy.alive = false;

      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        state.particles.push(
          new Particle(
            state.player.x,
            state.player.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            300 + Math.random() * 300,
            "rgba(0, 255, 190, 0.8)",
          ),
        );
      }
      if (state.player.hp <= 0) {
        endGame();
        return;
      }
    }
  }
  state.enemies = state.enemies.filter((e) => e.alive);

  // постепенный спаун врагов из очереди во время волны
  if (state.enemyQueue.length > 0) {
    const now = performance.now();
    const spawnInterval = 200 + Math.random() * 200; // интервал между спаунами: 200-400ms

    if (now - state.lastSpawnTime >= spawnInterval) {
      const enemyData = state.enemyQueue.shift(); // берём первого из очереди
      const pos = getSpawnPosition();
      state.enemies.push(new Enemy(pos.x, pos.y, enemyData.type, enemyData.speedMult));
      state.lastSpawnTime = now;
    }
  }

  // логика волн:
  // - текущая волна конечна
  // - когда все враги убиты и очередь пуста, проверяем нужен ли босс или показываем сообщение
  // - в режиме Аркада на волнах 3, 6, 9... появляется босс после убийства всех врагов
  if (state.enemies.length === 0 && state.enemyQueue.length === 0 && state.bosses.length === 0 && !state.waveCompleteMessage) {
    state.spawnTimer += dt * 16;
    if (state.spawnTimer > 800) {
      // Проверяем, нужен ли босс в режиме Аркада (на волнах 3, 6, 9...)
      if (state.gameMode === "arcade" && state.wave % 3 === 0 && state.wave > 0 && !state.bossDefeated) {
        // Спауним босса в случайном месте спауна
        const pos = getSpawnPosition();
        state.bosses.push(new Boss(pos.x, pos.y, state.wave));
        state.notifications.push(new Notification(pos.x, pos.y, "⚠ БОСС! ⚠"));
        state.spawnTimer = 0;
      } else {
      // Показываем сообщение о завершении волны (2 секунды пауза)
      state.waveCompleteMessage = { text: `Волна ${state.wave} пройдена`, time: 2000 };
        state.spawnTimer = 0;
      }
    }
  } else {
    state.spawnTimer = 0;
  }
  
  // Обработка сообщения о завершении волны
  if (state.waveCompleteMessage) {
    state.waveCompleteMessage.time -= dt * 16;
    if (state.waveCompleteMessage.time <= 0) {
      // Переходим на следующую волну
      state.wave++;
      waveEl.textContent = state.wave;
      state.bossDefeated = false; // сбрасываем флаг для новой волны
      spawnEnemyWave();
      state.waveCompleteMessage = null;
    }
  }
  
  // После убийства босса показываем сообщения (чекпоинт и волна пройдена одновременно)
  if (state.bossDefeated && state.bosses.length === 0 && state.enemies.length === 0 && state.enemyQueue.length === 0 && !state.waveCompleteMessage) {
    state.spawnTimer += dt * 16;
    if (state.spawnTimer > 800) {
      // Показываем сообщение о завершении волны (2 секунды пауза)
      state.waveCompleteMessage = { text: `Волна ${state.wave} пройдена`, time: 2000 };
      state.spawnTimer = 0;
    }
  }
  
  // Обновление боссов
  state.bosses.forEach((boss) => boss.update(dt));
  
  // Столкновения пуль с боссами
  for (const bullet of state.bullets) {
    if (!bullet.alive) continue;
    for (const boss of state.bosses) {
      if (!boss.alive) continue;
      // Проверяем, не пробила ли уже эта пуля этого босса (для пробивающих пуль)
      if (bullet.piercing && bullet.hitTargets.includes(boss)) continue;
      
      const dist = Math.hypot(boss.x - bullet.x, boss.y - bullet.y);
      if (dist < boss.radius + bullet.radius) {
        const damage = bullet.weaponData ? (bullet.weaponData.damage || 1) : 1;
        boss.hit(damage);
        
        if (bullet.piercing) {
          // Пробивающая пуля продолжает полет
          bullet.hitTargets.push(boss); // отмечаем, что этот босс уже пробит
          
          // Визуальный эффект попадания
          for (let i = 0; i < 8; i++) {
            const partAngle = Math.random() * Math.PI * 2;
            state.particles.push(
              new Particle(
                boss.x,
                boss.y,
                Math.cos(partAngle) * (2 + Math.random()),
                Math.sin(partAngle) * (2 + Math.random()),
                150 + Math.random() * 150,
                "rgba(0, 255, 255, 0.95)",
              ),
            );
          }
        } else {
          bullet.alive = false;
        }
        if (!bullet.piercing) break; // обычные пули останавливаются после первого попадания
      }
    }
  }
  
  // Столкновение игрока с боссом
  for (const boss of state.bosses) {
    if (!boss.alive) continue;
    const dist = Math.hypot(boss.x - state.player.x, boss.y - state.player.y);
    if (dist < boss.radius + state.player.radius - 4) {
      if (state.playerShield <= 0) {
        state.player.hp -= boss.damage;
        hpEl.textContent = Math.max(0, state.player.hp);
      }
      
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        state.particles.push(
          new Particle(
            state.player.x,
            state.player.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            300 + Math.random() * 300,
            "rgba(255, 0, 102, 0.9)",
          ),
        );
      }
      
      if (state.player.hp <= 0) {
        endGame();
        return;
      }
    }
  }
  
  state.bosses = state.bosses.filter((b) => b.alive);
  
  // После убийства босса переходим на следующую волну
  if (state.bosses.length === 0 && state.enemies.length === 0 && state.enemyQueue.length === 0 && state.spawnTimer > 800) {
    state.wave++;
    waveEl.textContent = state.wave;
    spawnEnemyWave();
    state.spawnTimer = 0;
  }

  // gold
  state.gold.forEach((g) => g.update(dt));
  state.gold = state.gold.filter((g) => !g.collected);

  // medkits
  state.medkits.forEach((m) => m.update(dt));
  state.medkits = state.medkits.filter((m) => !m.collected);

  // bonuses
  state.bonuses.forEach((b) => b.update(dt));
  state.bonuses = state.bonuses.filter((b) => !b.collected);

  // weapons
  state.weapons.forEach((w) => w.update(dt));
  state.weapons = state.weapons.filter((w) => !w.collected);

  // explosions
  if (state.explosions) {
    state.explosions.forEach((e) => e.update(dt));
    state.explosions = state.explosions.filter((e) => e.alive);
  }

  // notifications
  state.notifications.forEach((n) => n.update(dt));
  state.notifications = state.notifications.filter((n) => n.life > 0);

  // спаун бонусов периодически (реже)
  if (state.bonuses.length === 0 && Math.random() < 0.0005) {
    spawnBonus();
  }

  // спаун оружия периодически (выключен, если врагов 10 или менее)
  const aliveEnemies = state.enemies.filter(e => e.alive).length;
  const aliveBosses = state.bosses.filter(b => b.alive).length;
  // если есть боссы, увеличиваем частоту спавна оружия в 2 раза
  const weaponSpawnChance = aliveBosses > 0 ? 0.0006 : 0.0003;
  if (state.weapons.length === 0 && aliveEnemies > 10 && Math.random() < weaponSpawnChance) {
    spawnWeapon();
  }

  // обновление эффектов
  if (state.playerSpeedBoost > 0) {
    state.playerSpeedBoost -= dt * 16;
    if (state.playerSpeedBoost <= 0) {
      state.playerSpeedBoost = 0;
    }
  }

  if (state.playerShield > 0) {
    state.playerShield -= dt * 16;
    if (state.playerShield <= 0) {
      state.playerShield = 0;
    }
  }

  if (state.enemiesFrozen > 0) {
    state.enemiesFrozen -= dt * 16;
    if (state.enemiesFrozen <= 0) {
      state.enemiesFrozen = 0;
    }
  }

  if (state.laserCannon > 0) {
    state.laserCannon -= dt * 16;
    if (state.laserCannon <= 0) {
      state.laserCannon = 0;
    }
  }


  // particles
  state.particles.forEach((p) => p.update(dt));
  state.particles = state.particles.filter((p) => p.life > 0);
}

function drawBackground() {
  // Основной фон арены - тёмная каменная поверхность
  const grd = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    0,
    WIDTH / 2,
    HEIGHT / 2,
    Math.max(WIDTH, HEIGHT) / 1.2,
  );
  grd.addColorStop(0, "#1a1f2e");
  grd.addColorStop(0.3, "#151820");
  grd.addColorStop(0.6, "#0f1218");
  grd.addColorStop(1, "#0a0d12");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Текстура пола - каменные плиты
  ctx.strokeStyle = "rgba(40, 50, 60, 0.3)";
  ctx.lineWidth = 2;
  const tileSize = 80;
  
  // Вертикальные линии плит
  for (let x = 0; x < WIDTH; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  
  // Горизонтальные линии плит
  for (let y = 0; y < HEIGHT; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  
  // Тени между плитами
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
  ctx.lineWidth = 1;
  for (let x = tileSize; x < WIDTH; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x - 1, 0);
    ctx.lineTo(x - 1, HEIGHT);
    ctx.stroke();
  }
  for (let y = tileSize; y < HEIGHT; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y - 1);
    ctx.lineTo(WIDTH, y - 1);
    ctx.stroke();
  }

  // Детали на плитах - трещины и износ
  ctx.strokeStyle = "rgba(20, 25, 30, 0.5)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 15; i++) {
    const x1 = Math.random() * WIDTH;
    const y1 = Math.random() * HEIGHT;
    const x2 = x1 + (Math.random() - 0.5) * 60;
    const y2 = y1 + (Math.random() - 0.5) * 60;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Границы арены - видимые стены
  const borderWidth = 8;
  const borderColor = "rgba(100, 50, 50, 0.8)";
  const borderGlow = "rgba(150, 75, 75, 0.4)";
  
  // Верхняя граница
  const topGradient = ctx.createLinearGradient(0, 0, 0, borderWidth);
  topGradient.addColorStop(0, borderGlow);
  topGradient.addColorStop(1, borderColor);
  ctx.fillStyle = topGradient;
  ctx.fillRect(0, 0, WIDTH, borderWidth);
  
  // Нижняя граница
  const bottomGradient = ctx.createLinearGradient(0, HEIGHT - borderWidth, 0, HEIGHT);
  bottomGradient.addColorStop(0, borderColor);
  bottomGradient.addColorStop(1, borderGlow);
  ctx.fillStyle = bottomGradient;
  ctx.fillRect(0, HEIGHT - borderWidth, WIDTH, borderWidth);
  
  // Левая граница
  const leftGradient = ctx.createLinearGradient(0, 0, borderWidth, 0);
  leftGradient.addColorStop(0, borderGlow);
  leftGradient.addColorStop(1, borderColor);
  ctx.fillStyle = leftGradient;
  ctx.fillRect(0, 0, borderWidth, HEIGHT);
  
  // Правая граница
  const rightGradient = ctx.createLinearGradient(WIDTH - borderWidth, 0, WIDTH, 0);
  rightGradient.addColorStop(0, borderColor);
  rightGradient.addColorStop(1, borderGlow);
  ctx.fillStyle = rightGradient;
  ctx.fillRect(WIDTH - borderWidth, 0, borderWidth, HEIGHT);
  
  // Углы арены - декоративные элементы
  const cornerSize = 20;
  ctx.fillStyle = "rgba(120, 60, 60, 0.6)";
  // Верхний левый
  ctx.fillRect(0, 0, cornerSize, cornerSize);
  // Верхний правый
  ctx.fillRect(WIDTH - cornerSize, 0, cornerSize, cornerSize);
  // Нижний левый
  ctx.fillRect(0, HEIGHT - cornerSize, cornerSize, cornerSize);
  // Нижний правый
  ctx.fillRect(WIDTH - cornerSize, HEIGHT - cornerSize, cornerSize, cornerSize);
  
  // Сетка для ориентации (более заметная)
  ctx.strokeStyle = "rgba(60, 70, 80, 0.15)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = gridSize; x < WIDTH; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, borderWidth);
    ctx.lineTo(x, HEIGHT - borderWidth);
    ctx.stroke();
  }
  for (let y = gridSize; y < HEIGHT; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(borderWidth, y);
    ctx.lineTo(WIDTH - borderWidth, y);
    ctx.stroke();
  }
  
  // Центральная метка арены
  const centerSize = 60;
  ctx.strokeStyle = "rgba(100, 100, 150, 0.3)";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(WIDTH / 2, HEIGHT / 2, centerSize, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Кровь и следы на арене (декоративные пятна)
  ctx.fillStyle = "rgba(80, 0, 0, 0.2)";
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    const size = 10 + Math.random() * 20;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpawnPoints() {
  // отрисовываем точки спауна на карте
  for (const point of state.spawnPoints) {
    // внешнее свечение
    const outerGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 30);
    outerGradient.addColorStop(0, "rgba(255, 100, 200, 0.4)");
    outerGradient.addColorStop(0.5, "rgba(255, 100, 200, 0.15)");
    outerGradient.addColorStop(1, "rgba(255, 100, 200, 0)");
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 30, 0, Math.PI * 2);
    ctx.fill();

    // внутреннее свечение
    const innerGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 15);
    innerGradient.addColorStop(0, "rgba(255, 150, 255, 0.8)");
    innerGradient.addColorStop(1, "rgba(255, 150, 255, 0)");
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
    ctx.fill();

    // центральная точка
    ctx.fillStyle = "#ff64c8";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // контур
    ctx.strokeStyle = "rgba(255, 100, 200, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function render() {
  drawBackground();
  
  drawSpawnPoints(); // отрисовываем точки спауна

  state.gold.forEach((g) => g.draw());
  state.medkits.forEach((m) => m.draw());
  state.bonuses.forEach((b) => b.draw());
  state.weapons.forEach((w) => w.draw());
  state.explosions.forEach((e) => e.draw());
  state.particles.forEach((p) => p.draw());
  state.enemies.forEach((e) => e.draw());
  state.bullets.forEach((b) => b.draw());
  state.enemyBullets.forEach((b) => b.draw());
  state.bosses.forEach((b) => b.draw()); // отрисовка боссов
  if (state.player) state.player.draw();
  
  // уведомления поверх всего
  state.notifications.forEach((n) => n.draw());
  
  // Сообщение о завершении волны (и чекпоинт если есть)
  if (state.waveCompleteMessage) {
    const alpha = Math.min(1, state.waveCompleteMessage.time / 500);
    
    // Показываем сообщение о волне ниже на экране (без затемнения)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
    ctx.lineWidth = 6;
    ctx.strokeText(state.waveCompleteMessage.text, WIDTH / 2, HEIGHT / 2 - 50);
    ctx.fillText(state.waveCompleteMessage.text, WIDTH / 2, HEIGHT / 2 - 50);
    
    // Если это после убийства босса в режиме Аркада, показываем также "Чекпоинт"
    if (state.bossDefeated && state.gameMode === "arcade" && state.wave % 3 === 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.font = "bold 36px Arial";
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
      ctx.lineWidth = 5;
      ctx.strokeText("Чекпоинт", WIDTH / 2, HEIGHT / 2 + 10);
      ctx.fillText("Чекпоинт", WIDTH / 2, HEIGHT / 2 + 10);
    }
  }
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(2.5, (now - lastTime) / 16.67); // нормализация под ~60fps
  lastTime = now;

  if (!state.paused) {
    update(dt, now);
  }
  render();

  requestAnimationFrame(loop);
}

// input (используем e.code, чтобы раскладка не имела значения)
window.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "KeyW":
      keys.w = true;
      break;
    case "KeyA":
      keys.a = true;
      break;
    case "KeyS":
      keys.s = true;
      break;
    case "KeyD":
      keys.d = true;
      break;
    case "ArrowUp":
      keys.up = true;
      break;
    case "ArrowDown":
      keys.down = true;
      break;
    case "ArrowLeft":
      keys.left = true;
      break;
    case "ArrowRight":
      keys.right = true;
      break;
    case "KeyR":
      if (state.player) state.player.reload(performance.now());
      break;
    case "KeyQ":
      // пауза и открытие магазина
      if (state.running && !state.paused) {
        state.paused = true;
        showShopMenu();
      } else if (state.paused) {
        state.paused = false;
        shopMenuEl.classList.add("hidden");
      }
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "KeyW":
      keys.w = false;
      break;
    case "KeyA":
      keys.a = false;
      break;
    case "KeyS":
      keys.s = false;
      break;
    case "KeyD":
      keys.d = false;
      break;
    case "ArrowUp":
      keys.up = false;
      break;
    case "ArrowDown":
      keys.down = false;
      break;
    case "ArrowLeft":
      keys.left = false;
      break;
    case "ArrowRight":
      keys.right = false;
      break;
  }
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * WIDTH;
  mouse.y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
});

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0) mouse.down = true;
});

window.addEventListener("mouseup", (e) => {
  if (e.button === 0) mouse.down = false;
});

// Функции меню
function showMainMenu() {
  mainMenuEl.classList.remove("hidden");
  shopMenuEl.classList.add("hidden");
  leaderboardMenuEl.classList.add("hidden");
  checkinMenuEl.classList.add("hidden");
  gameOverEl.classList.add("hidden");
  drawPlayerPreview();
  updateCheckpointList();
}

function updateCheckpointList() {
  const checkpointSelector = document.getElementById("checkpoint-selector");
  const checkpointList = document.getElementById("checkpoint-list");
  
  // Скрываем блок выбора чекпоинта для режима Арена
  if (state.gameMode === "arena") {
    checkpointSelector.classList.add("hidden");
    return;
  }
  
  if (state.gameMode === "arcade" && state.checkpoints.length > 0) {
    checkpointSelector.classList.remove("hidden");
    checkpointList.innerHTML = "";
    
    // Добавляем опцию "Начать с начала"
    const startNewBtn = document.createElement("button");
    startNewBtn.className = "checkpoint-btn";
    startNewBtn.textContent = "С начала";
    startNewBtn.dataset.checkpoint = "new";
    checkpointList.appendChild(startNewBtn);
    
    // Добавляем чекпоинты
    state.checkpoints.forEach((checkpoint, index) => {
      const btn = document.createElement("button");
      btn.className = "checkpoint-btn";
      btn.textContent = `Волна ${checkpoint.wave} (Счёт: ${checkpoint.score})`;
      btn.dataset.checkpoint = index;
      checkpointList.appendChild(btn);
    });
  } else {
    checkpointSelector.classList.add("hidden");
  }
}

function showShopMenu() {
  if (state.running) {
    // во время игры просто показываем магазин поверх
    shopMenuEl.classList.remove("hidden");
  } else {
    // в меню скрываем главное меню
    mainMenuEl.classList.add("hidden");
    shopMenuEl.classList.remove("hidden");
  }
  updateShopMenu();
}

function showLeaderboardMenu() {
  mainMenuEl.classList.add("hidden");
  leaderboardMenuEl.classList.remove("hidden");
  renderLeaderboard();
}

function showCheckinMenu() {
  mainMenuEl.classList.add("hidden");
  checkinMenuEl.classList.remove("hidden");
  setCheckinStatus("", "");
  updateCheckinUi();
}

function drawPlayerPreview() {
  if (!playerPreviewCtx) return;
  const previewCtx = playerPreviewCtx;
  const size = 120;
  previewCtx.clearRect(0, 0, size, size);
  
  const stats = PLAYER_STATS;
  const centerX = size / 2;
  const centerY = size / 2;
  const previewRadius = stats.radius * 2.5; // Масштаб для превью
  
  previewCtx.save();
  previewCtx.translate(centerX, centerY);
  
  // Свечение вокруг солдата
  const gradient = previewCtx.createRadialGradient(0, 0, 0, 0, 0, previewRadius * 1.2);
  gradient.addColorStop(0, stats.glowColor);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  previewCtx.fillStyle = gradient;
  previewCtx.beginPath();
  previewCtx.arc(0, 0, previewRadius * 1.2, 0, Math.PI * 2);
  previewCtx.fill();
  
  const spriteSize = previewRadius;
  
  // Тело солдата (торс)
  previewCtx.fillStyle = "#2c3e50";
  previewCtx.fillRect(-spriteSize * 0.25, -spriteSize * 0.2, spriteSize * 0.5, spriteSize * 0.6);
  
  // Голова солдата (шлем)
  previewCtx.fillStyle = "#34495e";
  previewCtx.beginPath();
  previewCtx.arc(0, -spriteSize * 0.4, spriteSize * 0.2, 0, Math.PI * 2);
  previewCtx.fill();
  
  // Визор шлема
  previewCtx.fillStyle = "#1a252f";
  previewCtx.fillRect(-spriteSize * 0.15, -spriteSize * 0.45, spriteSize * 0.3, spriteSize * 0.1);
  
  // Руки солдата
  previewCtx.fillStyle = "#2c3e50";
  // Левая рука
  previewCtx.fillRect(-spriteSize * 0.35, -spriteSize * 0.1, spriteSize * 0.15, spriteSize * 0.4);
  // Правая рука (держит оружие)
  previewCtx.fillRect(spriteSize * 0.2, -spriteSize * 0.1, spriteSize * 0.15, spriteSize * 0.4);
  
  // Ноги солдата
  previewCtx.fillStyle = "#1a252f";
  previewCtx.fillRect(-spriteSize * 0.2, spriteSize * 0.4, spriteSize * 0.18, spriteSize * 0.35);
  previewCtx.fillRect(spriteSize * 0.02, spriteSize * 0.4, spriteSize * 0.18, spriteSize * 0.35);
  
  // Ботинки
  previewCtx.fillStyle = "#000000";
  previewCtx.fillRect(-spriteSize * 0.25, spriteSize * 0.75, spriteSize * 0.2, spriteSize * 0.1);
  previewCtx.fillRect(spriteSize * 0.05, spriteSize * 0.75, spriteSize * 0.2, spriteSize * 0.1);
  
  // Разгрузка/бронежилет
  previewCtx.strokeStyle = "#34495e";
  previewCtx.lineWidth = 2;
  previewCtx.strokeRect(-spriteSize * 0.25, -spriteSize * 0.2, spriteSize * 0.5, spriteSize * 0.4);
  
  // Оружие в руках (направлено вправо)
  const weaponLength = spriteSize * 0.6;
  const weaponX = spriteSize * 0.3;
  const weaponY = 0;
  
  // Пистолет
  previewCtx.fillStyle = "#654321";
  previewCtx.fillRect(weaponX, weaponY - spriteSize * 0.05, weaponLength * 0.4, spriteSize * 0.1);
  previewCtx.fillStyle = "#333333";
  previewCtx.fillRect(weaponX + weaponLength * 0.4, weaponY - spriteSize * 0.06, weaponLength * 0.3, spriteSize * 0.12);
  
  previewCtx.restore();
}

function updateShopMenu() {
  shopGoldEl.textContent = state.goldAmount;
  shopItemsEl.innerHTML = "";

  const upgrades = [
    {
      key: "maxHp",
      name: "Увеличение здоровья",
      description: `+20 HP (текущее: ${PLAYER_STATS.maxHp + state.upgrades.maxHp})`,
      price: 50 + state.upgrades.maxHp * 10, // еще дешевле
      current: state.upgrades.maxHp,
    },
    {
      key: "reloadSpeed",
      name: "Скорость перезарядки",
      description: `+10% к скорости перезарядки (текущее: +${state.upgrades.reloadSpeed}%)`,
      price: 40 + state.upgrades.reloadSpeed * 5, // еще дешевле
      current: state.upgrades.reloadSpeed,
    },
    {
      key: "fireRate",
      name: "Скорострельность",
      description: `+10% к скорострельности (текущее: +${state.upgrades.fireRate}%)`,
      price: 45 + state.upgrades.fireRate * 5,
      current: state.upgrades.fireRate,
    },
    {
      key: "moveSpeed",
      name: "Скорость движения",
      description: `+5% к скорости движения (текущее: +${state.upgrades.moveSpeed}%)`,
      price: 35 + state.upgrades.moveSpeed * 3, // еще дешевле
      current: state.upgrades.moveSpeed,
    },
  ];

  for (const upgrade of upgrades) {
    const item = document.createElement("div");
    item.className = "shop-item";
    const canBuy = state.goldAmount >= upgrade.price;

    item.innerHTML = `
      <div>
        <h3>${upgrade.name}</h3>
        <p>${upgrade.description}</p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <button ${!canBuy ? "disabled" : ""} class="buy-btn">${upgrade.price}💰 Купить</button>
      </div>
    `;

    const buyBtn = item.querySelector(".buy-btn");
    if (buyBtn && canBuy) {
      buyBtn.addEventListener("click", () => {
        if (state.goldAmount >= upgrade.price) {
          state.goldAmount -= upgrade.price;
          setStoredArcadeGold(state.goldAmount);
          if (upgrade.key === "maxHp") {
            state.upgrades.maxHp += 20;
          } else if (upgrade.key === "reloadSpeed") {
            state.upgrades.reloadSpeed += 10;
          } else if (upgrade.key === "fireRate") {
            state.upgrades.fireRate += 10;
            // обновляем fireDelay игрока
            if (state.player && state.player.weapon) {
              state.player.fireDelay = state.player.weapon.fireDelay / (1 + state.upgrades.fireRate / 100);
            }
          } else if (upgrade.key === "moveSpeed") {
            state.upgrades.moveSpeed += 5;
          }
          updateShopMenu();
          goldEl.textContent = state.goldAmount;
        }
      });
    }

    shopItemsEl.appendChild(item);
  }
}

// Обработчики событий
let selectedCheckpoint = null;

// Выбор режима игры
const modeDescriptionEl = document.getElementById("mode-description");
const modeDescriptions = {
  arena: "Режим Арена: Бесконечные волны врагов. Выживайте как можно дольше и набирайте очки!",
  arcade: "Режим Аркада: Классический режим с чекпоинтами. Сохраняйте прогресс и продолжайте с последней волны."
};

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.gameMode = btn.dataset.mode;
    selectedCheckpoint = null;
    updateCheckpointList();
    
    // Обновляем описание режима
    if (modeDescriptionEl && modeDescriptions[state.gameMode]) {
      modeDescriptionEl.textContent = modeDescriptions[state.gameMode];
      modeDescriptionEl.style.display = "block";
    }
  });
});

// Выбор чекпоинта
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("checkpoint-btn")) {
    document.querySelectorAll(".checkpoint-btn").forEach(b => b.classList.remove("selected"));
    e.target.classList.add("selected");
    if (e.target.dataset.checkpoint === "new") {
      selectedCheckpoint = null;
    } else {
      selectedCheckpoint = state.checkpoints[parseInt(e.target.dataset.checkpoint)];
    }
  }
});

startBtn.addEventListener("click", () => {
  mainMenuEl.classList.add("hidden");
  gameOverEl.classList.add("hidden");
  resetGame(selectedCheckpoint);
});

restartBtn.addEventListener("click", () => {
  gameOverEl.classList.add("hidden");
  resetGame();
});

menuBtn.addEventListener("click", () => {
  showMainMenu();
});

shopBtn.addEventListener("click", () => {
  showShopMenu();
});

if (leaderboardBtn) {
  leaderboardBtn.addEventListener("click", () => {
    showLeaderboardMenu();
  });
}

if (checkinBtn) {
  checkinBtn.addEventListener("click", () => {
    showCheckinMenu();
  });
}

if (backFromLeaderboardBtn) {
  backFromLeaderboardBtn.addEventListener("click", () => {
    showMainMenu();
  });
}

if (backFromCheckinBtn) {
  backFromCheckinBtn.addEventListener("click", () => {
    showMainMenu();
  });
}

if (checkinActionBtn) {
  checkinActionBtn.addEventListener("click", () => {
    handleCheckinAction();
  });
}

backFromShopBtn.addEventListener("click", () => {
  if (state.running) {
    // во время игры просто закрываем магазин и снимаем паузу
    shopMenuEl.classList.add("hidden");
    state.paused = false;
  } else {
    // в меню возвращаемся в главное меню
    showMainMenu();
  }
});

// отрисовка персонажа в меню при загрузке
if (playerPreviewCanvas) {
  drawPlayerPreview();
}

// Показываем описание режима при загрузке
if (modeDescriptionEl && modeDescriptions[state.gameMode]) {
  modeDescriptionEl.textContent = modeDescriptions[state.gameMode];
  modeDescriptionEl.style.display = "block";
}

if (nicknameInput) {
  nicknameInput.value = getStoredNickname();
  nicknameInput.addEventListener("input", (e) => {
    const target = e.target;
    if (!target) return;
    setStoredNickname(target.value || "");
  });
}

updateCheckinUi();
setInterval(() => {
  updateCheckinUi();
}, 1000);

// старт рендера
requestAnimationFrame(loop);

// подгоняем размер игрового поля под окно пользователя
window.addEventListener("resize", () => {
  resizeCanvas();
});

