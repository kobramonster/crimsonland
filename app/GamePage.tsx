import Script from "next/script";

export default function GamePage() {
  return (
    <>
      <div className="ui">
        <h1>Crimsonland Base Arena</h1>
        <div className="stats">
          <span>
            HP: <span id="hp">100</span>
          </span>
          <span>
            Score: <span id="score">0</span>
          </span>
          <span>
            Wave: <span id="wave">1</span>
          </span>
        </div>
        <div className="gold-display">
          <span>
            💰 <span id="gold">0</span>
          </span>
        </div>
        <div className="help">
          WASD/Стрелки — движение, мышь — прицел, ЛКМ — стрельба, R — перезарядка.
        </div>
      </div>

      <div className="shop-hint" id="shop-hint">
        <div className="shop-hint-key">Q</div>
        <div className="shop-hint-label">Магазин</div>
      </div>

      <canvas id="game"></canvas>

      <div className="overlay" id="main-menu">
        <div className="panel menu-panel">
          <div className="menu-left">
            <canvas id="player-preview" width="120" height="120"></canvas>
          </div>
          <div className="menu-right">
            <h2>Crimsonland Base Arena</h2>
            <p>
              Выживайте против волн врагов.
              <br />
              Чем дольше живёте — тем выше счёт.
            </p>
            <div className="game-mode-selector">
              <label>Режим игры:</label>
              <div className="mode-buttons">
                <button className="mode-btn active" data-mode="arcade">
                  Аркада
                </button>
                <button className="mode-btn" data-mode="arena">
                  Арена
                </button>
              </div>
            </div>
            <div id="checkpoint-selector" className="checkpoint-selector hidden">
              <label>Начать с чекпоинта:</label>
              <div id="checkpoint-list"></div>
            </div>
            <div id="mode-description" className="mode-description"></div>
            <button id="start-btn">Начать игру</button>
            <button id="shop-btn">Магазин</button>
            <button id="leaderboard-btn">Лидерборд</button>
            <button id="checkin-btn">Онлайн чекин</button>
          </div>
        </div>
      </div>

      <div className="overlay hidden" id="shop-menu">
        <div className="panel">
          <h2>Магазин улучшений</h2>
          <p>
            Золото: <span id="shop-gold">0</span>
          </p>
          <div id="shop-items"></div>
          <button id="back-from-shop">Назад</button>
        </div>
      </div>

      <div className="overlay hidden" id="leaderboard-menu">
        <div className="panel">
          <h2>Лидерборд</h2>
          <div id="leaderboard-list" className="leaderboard-list"></div>
          <button id="back-from-leaderboard">Назад</button>
        </div>
      </div>

      <div className="overlay hidden" id="checkin-menu">
        <div className="panel">
          <h2>Онлайн чекин</h2>
          <p className="checkin-meta">
            Чекины: <span id="checkin-count">0</span>
          </p>
          <p className="checkin-meta">
            Бонус золота: <span id="checkin-multiplier">+0%</span>
          </p>
          <p className="checkin-timer">
            <span id="checkin-timer-label">До следующего чек-ина:</span>
            <span id="checkin-timer">--:--:--</span>
          </p>
          <p id="checkin-status" className="checkin-status"></p>
          <button id="checkin-action">Сделать чек-ин</button>
          <button id="back-from-checkin">Назад</button>
        </div>
      </div>

      <div className="overlay hidden" id="game-over">
        <div className="panel">
          <h2>Вы погибели</h2>
          <p>
            Счёт: <span id="final-score">0</span>
          </p>
          <p>
            Волна: <span id="final-wave">1</span>
          </p>
          <button id="restart-btn">Играть снова</button>
          <button id="menu-btn">Главное меню</button>
        </div>
      </div>

      <div className="overlay hidden" id="game-over">
        <div className="panel">
          <h2>Вы погибели</h2>
          <p>
            Счёт: <span id="final-score">0</span>
          </p>
          <p>
            Волна: <span id="final-wave">1</span>
          </p>
          <button id="restart-btn">Играть снова</button>
        </div>
      </div>

      <Script src="/game.js" strategy="afterInteractive" />
    </>
  );
}
