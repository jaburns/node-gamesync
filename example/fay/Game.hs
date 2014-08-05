module Game (
    dt,
    players,
    initialState,
    defaultInput,
    step
) where


data Ball = Ball {
    x :: Double
  , y :: Double
  , vx :: Double
  , vy :: Double
} deriving (Show)

data State = State {
    paddles :: (Double,Double)
  , score :: (Int,Int)
  , ball :: Ball
} deriving (Show)

data Input = Input {
    paddle :: Double
} deriving (Show)


initialState :: State
initialState = State (0.1,0) (0,0) (Ball 0.1 0 0.03 0.025)

defaultInput :: Input
defaultInput = Input 0

dt :: Int
dt = 50

players :: Int
players = 2

step :: Input -> State -> State
step i s = s { ball = stepBall (ball s) }
  where
    stepBall (Ball x y vx vy) = Ball (x+vx) (y+vy) vx vy

