if (localStorage.getItem('currentPlayerName') == null) {
    window.location = 'index.html';
}

const env = {
    width: 576,
    height: 864,
    mapSize: 25600,
    flagLeft: 0,
    flagRight: 1,
    tilePx: 64
}
Object.freeze(env);

var config = {
    type: Phaser.AUTO,
    width: env.width,
    height: env.height,
    physics: {
        default: 'arcade',
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var ship;
var movesText;
var timeText;
var gameOver = false;
var game = new Phaser.Game(config);
var moves = 0;
var tmpTimestamp = ''
var level = 2;

function preload() {
    this.load.image('ship', 'assets/images/ship.png');
    this.load.tilemapTiledJSON('map', 'assets/maps/space_map.json');
    this.load.image('spaceMapTileset', 'assets/images/space_tileset.png');

}
var timer;
function create() {

    this.cameras.main.setBounds(0, 0, env.width / 2, env.mapSize);
    this.physics.world.setBounds(0, 0, env.width, env.mapSize);

    var map = this.make.tilemap({ key: 'map' });
    var tileset = map.addTilesetImage('space_tileset', 'spaceMapTileset');
    map.createStaticLayer('background', tileset, 0, 0);

    var asteroidsLayer = map.createStaticLayer('asteroids', tileset, 0, 0);

    asteroidsLayer.setTileIndexCallback([20, 21, 22, 23, 24, 25, 26, 27], () => {
        //bottom part of a asteroid is hit , GAME OVER
        this.physics.pause();
        ship.setTint(0xff0000);
        gameOver = true;
    });

    ship = this.physics.add.image(env.width / 2, 25568, 'ship')
    ship.setCollideWorldBounds(true);

    timeText = this.add.text(16, 16, "Time: 0", {
        font: '24px Arial',
        fill: '#FFFFFF',
    });
    timeText.setScrollFactor(0);

    movesText = this.add.text(16, 64, "Moves: 0", {
        font: '24px Arial',
        fill: '#FFFFFF',
    });
    movesText.setScrollFactor(0);


    timer = this.time.addEvent({
        delay: 5000000,                // ms
    });
    this.input.keyboard.createCursorKeys(); //stops long pressing button

    this.physics.add.collider(ship, asteroidsLayer);
    this.cameras.main.startFollow(ship, true, 0.09, 0.09);
}

function update() {
    timeText.setText('Time: ' + timer.getElapsedSeconds().toFixed(3));

    if (gameOver || ship.y == 32) { //ship reach the top of the map

        storeResultsInLocalStorage()
        setTimeout(function () {
            window.location = 'scoreboard.html';
        }, 2000);
        return;
    }


    this.cameras.main.scrollY -= (35 + level)
    ship.y -= (1 + level);

    this.input.keyboard.on('keydown_LEFT', function (event) {
        moveShip(event, env.flagLeft)
    });
    this.input.keyboard.on('keydown_RIGHT', function (event) {
        moveShip(event, env.flagRight)
    });

}

function moveShip(event, direction) {
    if (gameOver) {
        return;
    }

    if (tmpTimestamp != event.timeStamp) {
        tmpTimestamp = event.timeStamp

        if (direction == env.flagLeft) {

            //Note: Blocking the moves counter if you are in the left edge and continue pressing left
            if (ship.x - env.tilePx > 0) {
                ship.x -= env.tilePx;
                moves++;
            }
        } else {

            //Note: Blocking the moves counter if you are in the right edge and continue pressing right
            if (ship.x + env.tilePx < env.width) {
                ship.x += env.tilePx;
                moves++;
            }
        }
        movesText.setText('Moves: ' + moves);

        increaseLevelBasedOnMoves();
    }
}

function increaseLevelBasedOnMoves() {
    if (level < 9 && moves % 19 == 0) {
        level++;
    }
}

var currentScoreStored = false;
function storeResultsInLocalStorage() {
    timer.paused = true;

    if (currentScoreStored == false) {

        let retrievedString = localStorage.getItem('players');
        if (retrievedString == null) {
            var players = []
        } else {
            var players = JSON.parse(retrievedString);
        }

        players.forEach(player => {
            player.scoreFromLastGame = false
        })

        players.push({
            playerName: localStorage.getItem('currentPlayerName'),
            completed: Math.ceil((100 - ((ship.y / env.mapSize) * 100))),
            moves: moves,
            time: timer.getElapsedSeconds().toFixed(3),
            scoreFromLastGame: true,
        })

        players.sort(
            function (a, b) {
                if (a.completed == b.completed) {
                    return a.moves - b.moves;
                }
                return a.completed < b.completed ? 1 : -1;
            });

        localStorage.setItem("players", JSON.stringify(players));
    }
    currentScoreStored = true;
}