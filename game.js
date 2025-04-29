const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")
const menu = document.getElementById("menu")
const leaderboardList = document.getElementById("leaderboard")
const startButton = document.getElementById("startButton")
const difficultySelect = document.getElementById("difficulty")
const brickHitSound = document.getElementById("brickHitSound")
const paddleHitSound = document.getElementById("paddleHitSound")
const gameOverSound = document.getElementById("gameOverSound")

const ballRadius = 15 // Increased from 10
let x, y, dx, dy
const paddleHeight = 15 // Increased from 10
let paddleWidth
let paddleX
let rightPressed = false
let leftPressed = false
const brickRowCount = 5
const brickColumnCount = 7 // Increased to match the image
const brickWidth = 100 // Increased from 60
const brickHeight = 30 // Increased from 20
const brickPadding = 5 // Reduced padding to fit more bricks
const brickOffsetTop = 50 // Adjusted for new canvas size
const brickOffsetLeft = 25 // Adjusted for new canvas size
let score = 0
let bricks = []
let interval
let animationId
let gameOver = false
let backgroundPattern

// Define brick colors for each row
const brickColors = [
  "#FF0000", // Red
  "#FF7F00", // Orange
  "#FFFF00", // Yellow
  "#FF00FF", // Pink
  "#00FF00", // Green
]

const difficulties = {
  easy: { ballSpeed: 2, paddleWidth: 200 }, // Increased from 120
  medium: { ballSpeed: 3, paddleWidth: 150 }, // Increased from 75
  hard: { ballSpeed: 5, paddleWidth: 100 }, // Increased from 40
}

// Add this helper function at the top of your file
function showToast(message, type = "info") {
  const backgroundColor = type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#2196f3"

  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "center",
    backgroundColor,
    stopOnFocus: true,
  }).showToast()
}

// Add this helper function for playing sounds
function playSound(audio) {
  audio.currentTime = 0 // Reset sound to start
  audio.play().catch((error) => console.log("Audio play failed:", error))
}

// Create background pattern
function createBackgroundPattern() {
  const patternCanvas = document.createElement("canvas")
  const patternContext = patternCanvas.getContext("2d")
  patternCanvas.width = 20
  patternCanvas.height = 20

  // Draw pattern
  patternContext.fillStyle = "#0000AA" // Dark blue base
  patternContext.fillRect(0, 0, 20, 20)

  // Add diagonal lines for pattern
  patternContext.strokeStyle = "#0000FF" // Slightly lighter blue
  patternContext.lineWidth = 1
  patternContext.beginPath()
  patternContext.moveTo(0, 20)
  patternContext.lineTo(20, 0)
  patternContext.stroke()

  return ctx.createPattern(patternCanvas, "repeat")
}

// Start the game
startButton.onclick = () => {
  setupGame()
  menu.style.display = "none"
  canvas.style.display = "block"
  draw()
}

function setupGame() {
  // Reset game over state
  gameOver = false

  // Create background pattern
  backgroundPattern = createBackgroundPattern()

  // Remove existing event listeners
  document.removeEventListener("keydown", keyDownHandler)
  document.removeEventListener("keyup", keyUpHandler)

  // Setup based on difficulty
  const difficulty = difficultySelect.value
  dx = difficulties[difficulty].ballSpeed
  dy = -difficulties[difficulty].ballSpeed
  paddleWidth = difficulties[difficulty].paddleWidth

  // Position ball and paddle
  x = canvas.width / 2
  y = canvas.height - 30
  paddleX = (canvas.width - paddleWidth) / 2

  // Initialize bricks
  bricks = []
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = []
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 }
    }
  }

  score = 0

  // Add new event listeners
  document.addEventListener("keydown", keyDownHandler, false)
  document.addEventListener("keyup", keyUpHandler, false)

  // Add mouse/touch controls for mobile compatibility
  canvas.addEventListener("mousemove", mouseMoveHandler, false)
  canvas.addEventListener("touchmove", touchMoveHandler, false)

  loadLeaderboard()
}

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false
}

function mouseMoveHandler(e) {
    const canvasRect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - canvasRect.left;
    
    // Allow paddle to move fully to both edges
    paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, relativeX - paddleWidth/2));
}

function touchMoveHandler(e) {
    e.preventDefault();
    const canvasRect = canvas.getBoundingClientRect();
    const relativeX = e.touches[0].clientX - canvasRect.left;
    
    // Allow paddle to move fully to both edges
    paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, relativeX - paddleWidth/2));
}

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r]
      if (b.status === 1) {
        if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
          dy = -dy
          b.status = 0
          score += 10
          playSound(brickHitSound)
          if (score === brickRowCount * brickColumnCount * 10) {
            // Victory celebration
            showToast("YOU WIN! 🎉", "success")
            
            // Add confetti effect
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
              return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
              const timeLeft = animationEnd - Date.now();

              if (timeLeft <= 0) {
                clearInterval(interval);
                setTimeout(() => {
                  document.location.reload();
                }, 1000);
                return;
              }

              const particleCount = 50 * (timeLeft / duration);
              // Since particles fall down, start a bit higher than the page
              confetti(Object.assign({}, defaults, { 
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
              }));
              confetti(Object.assign({}, defaults, { 
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
              }));
            }, 250);

            updateLeaderboard(score);
          }
        }
      }
    }
  }
}

function drawBall() {
  ctx.beginPath()
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2)
  ctx.fillStyle = "#FFFFFF" // White ball
  ctx.fill()
  ctx.closePath()
}

function drawPaddle() {
  // Draw paddle base
  ctx.beginPath()
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight)
  ctx.fillStyle = "#FF7F00" // Orange base
  ctx.fill()
  ctx.closePath()

  // Draw paddle highlight
  ctx.beginPath()
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight / 2)
  ctx.fillStyle = "#FF0000" // Red top
  ctx.fill()
  ctx.closePath()

  // Draw paddle shadow/reflection
  ctx.beginPath()
  ctx.rect(paddleX + 5, canvas.height - paddleHeight + 5, paddleWidth - 10, paddleHeight - 5)
  ctx.fillStyle = "#CCCCCC" // Gray reflection
  ctx.fill()
  ctx.closePath()
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop
        bricks[c][r].x = brickX
        bricks[c][r].y = brickY
        ctx.beginPath()
        ctx.rect(brickX, brickY, brickWidth, brickHeight)
        ctx.fillStyle = brickColors[r] // Use color based on row
        ctx.fill()
        ctx.closePath()
      }
    }
  }
}

function drawScore() {
  ctx.font = "16px Arial"
  ctx.fillStyle = "#FFFFFF" // White text for better visibility on blue background
  ctx.fillText("Score: " + score, 8, 20)
}

function drawBackground() {
  ctx.fillStyle = backgroundPattern
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw background first
  drawBackground()

  drawBricks()
  drawBall()
  drawPaddle()
  drawScore()
  collisionDetection()

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx
  }
  if (y + dy < ballRadius) {
    dy = -dy
  } else if (y + dy > canvas.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      // Calculate bounce angle based on where the ball hits the paddle
      const hitPoint = (x - paddleX) / paddleWidth
      const angle = hitPoint * Math.PI - Math.PI / 2 // -π/2 to π/2 range

      // Adjust dx based on where the ball hits the paddle
      const speed = Math.sqrt(dx * dx + dy * dy)
      dx = speed * Math.cos(angle)
      dy = -speed * Math.sin(angle)

      playSound(paddleHitSound) // Add paddle hit sound
    } else {
      gameOver = true
      cancelAnimationFrame(animationId)
      playSound(gameOverSound) // Add game over sound

      setTimeout(() => {
        showToast("GAME OVER!", "error")
        showNameModal(score)
      }, 100)
    }
  }

  x += dx
  y += dy

  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 7
  } else if (leftPressed && paddleX > 0) {
    paddleX -= 7
  }

  // Keep paddle within canvas boundaries
  if (paddleX < 0) {
    paddleX = 0
  } else if (paddleX > canvas.width - paddleWidth) {
    paddleX = canvas.width - paddleWidth
  }

  if (!gameOver) {
    animationId = requestAnimationFrame(draw)
  }
}

function updateLeaderboard(newScore, playerName = "Anonymous") {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || []

  // Add new score
  leaderboard.push({ name: playerName, score: newScore })

  // Sort by score (highest first)
  leaderboard.sort((a, b) => b.score - a.score)

  // Save all scores
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard))

  // Update display
  loadLeaderboard()
}

function loadLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || []
  const leaderboardList = document.getElementById("leaderboard")

  leaderboardList.innerHTML = ""

  leaderboard.forEach((entry, index) => {
    const li = document.createElement("li")
    li.innerHTML = `${index + 1}. ${entry.name} <span>${entry.score}</span>`
    leaderboardList.appendChild(li)
  })
}

function displayAllLeaderboardData() {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || []
  console.table(leaderboard) // This will show the data in a nice table format

  // Return the data in case you want to use it elsewhere
  return leaderboard
}

function showNameModal(finalScore) {
  const modal = document.getElementById("nameModal")
  const input = document.getElementById("playerNameInput")
  const scoreDisplay = document.getElementById("finalScoreDisplay")

  // Display the final score
  scoreDisplay.textContent = finalScore

  modal.style.display = "block"
  input.focus()
}

function submitScore() {
  const modal = document.getElementById("nameModal")
  const input = document.getElementById("playerNameInput")
  const playerName = input.value.trim() || "Anonymous"

  updateLeaderboard(score, playerName)
  modal.style.display = "none"
  canvas.style.display = "none"
  menu.style.display = "block"

  // Show a toast with the player's score
  showToast(`${playerName}'s final score: ${score}`, "info")

  loadLeaderboard()
}
