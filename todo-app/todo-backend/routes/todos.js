const express = require('express')
const { Todo } = require('../mongo')
const { getAsync, setAsync } = require('../redis')
const router = express.Router()

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos)
})

const incrementAddedTodos = async () => {
  const addedTodos = await getAsync('added_todos')
  await setAsync('added_todos', addedTodos ? parseInt(addedTodos) + 1 : 1)
}

/* POST todo to listing. */
router.post('/', async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    done: false,
  })
  incrementAddedTodos()
  res.send(todo)
})

const singleRouter = express.Router()

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  req.todo = await Todo.findById(id)
  if (!req.todo) return res.sendStatus(404)

  next()
}

/* DELETE todo. */
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete()
  res.sendStatus(200)
})

/* GET todo. */
singleRouter.get('/', async (req, res) => {
  res.send(req.todo)
})

/* PUT todo. */
singleRouter.put('/', async (req, res) => {
  await Todo.findByIdAndUpdate(req.todo.id, {
    text: req.body.text,
    done: req.body.done,
  })
  const todo = await Todo.findById(req.todo.id)
  res.send(todo)
})

router.use('/:id', findByIdMiddleware, singleRouter)

module.exports = router
