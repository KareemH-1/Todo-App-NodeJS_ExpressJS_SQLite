
let token = localStorage.getItem('token')

let isLoading = false
let isAuthenticating = false
let isRegistration = false
let selectedTab = 'All'
let todos = []

const apiBase = '/'

const nav = document.querySelector('nav')
const header = document.querySelector('header')
const main = document.querySelector('main')
const navElements = document.querySelectorAll('.tab-button')
const authContent = document.getElementById('auth')
const error = document.querySelector('.error')
const email = document.getElementById('email-input')
const password = document.getElementById('password-input')
const registerBtn = document.getElementById('register-btn')
const authBtn = document.getElementById('auth-btn') 

async function showDashboard() {
    nav.style.display = 'block'
    header.style.display = 'block'
    main.style.display = 'block'
    authContent.style.display = 'none'
    
    document.body.classList.remove('auth-mode')
    document.body.classList.add('dashboard-mode')

    await fetchTodos()
}

function updateHeaderText() {
    const todosLength = todos.length
    const newString = todos.length === 1 ?
        `You have 1 open task.` :
        `You have ${todosLength} open tasks.`
    header.querySelector('h1').innerText = newString
}

function updateNavCount() {
    if (!Array.isArray(todos)) {
        todos = []
    }
    
    navElements.forEach(ele => {
        const btnText = ele.innerText.split(' ')[0]

        const count = todos.filter(val => {
            if (btnText === 'All') {
                return true
            }
            return btnText === 'Complete' ?
                val.completed :
                !val.completed
        }).length

        ele.querySelector('span').innerText = `(${count})`
    })
}

function changeTab(tab) {
    selectedTab = tab
    navElements.forEach(val => {
        if (val.innerText.includes(tab)) {
            val.classList.add('selected-tab')
        } else {
            val.classList.remove('selected-tab')
        }
    })
    renderTodos()
}

function renderTodos() {
    updateNavCount()
    updateHeaderText()

    let todoList = ``
    
    if (!Array.isArray(todos)) {
        todos = []
    }
    
    const filteredTodos = todos.filter(val => {
        return selectedTab === 'All' ? true : selectedTab === 'Complete' ? val.completed : !val.completed
    });

    if (filteredTodos.length === 0) {
        todoList = `
            <div class="empty-state">
                <h3>No tasks found</h3>
                <p>Add a new task to get started!</p>
            </div>
        `;
    } else {
        filteredTodos.forEach((todo) => {
            const taskIndex = todo.id
            todoList += `
                <div class="todo-item">
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="updateTodo(${taskIndex})"></div>
                    <div class="todo-text ${todo.completed ? 'completed' : ''}">${todo.task}</div>
                    <div class="todo-actions">
                        <button class="todo-btn delete-btn" onclick="deleteTodo(${taskIndex})">Delete</button>
                    </div>
                </div>
            `;
        });
    }
    
    todoList += `
        <div class="add-todo-form">
            <input id="todoInput" class="add-todo-input" placeholder="Add a new task..." />
            <button class="add-todo-btn" onclick="addTodo()">Add Task</button>
        </div>
    `;
    
    main.innerHTML = todoList
}

async function changeForm() {
    isRegistration = !isRegistration
    registerBtn.innerText = isRegistration ? 'Login' : 'Register'
    document.querySelector('#auth > div h2').innerText = isRegistration ? 'Register' : 'Login'
    document.querySelector('.register-content p').innerText = isRegistration ? 'Already have an account?' : 'Don\'t have an account?'
    document.querySelector('.register-content button').innerText = isRegistration ? 'Login' : 'Register'
    authBtn.innerText = isRegistration ? 'Register' : 'Login'
}

async function authenticate() {
    const emailVal = email.value
    const passVal = password.value

    if (
        isLoading ||
        isAuthenticating ||
        !emailVal ||
        !passVal ||
        passVal.length < 6 ||
        !emailVal.includes('@')
    ) { return }

    error.style.display = 'none'
    isAuthenticating = true
    authBtn.innerText = 'Authenticating...'

    try {
        let data
        let response
        if (isRegistration) {
            response = await fetch(apiBase + 'auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: emailVal, password: passVal })
            })
        } else {
            response = await fetch(apiBase + 'auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: emailVal, password: passVal })
            })
        }

        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
            data = await response.json()
        } else {
            throw new Error('Server returned non-JSON response')
        }

        if (response.ok && data.token) {
            token = data.token
            localStorage.setItem('token', token)

            authBtn.innerText = 'Loading...'

            await fetchTodos()

            showDashboard()
        } else {
            throw new Error(data.message || 'Authentication failed')
        }

    } catch (err) {
        console.log(err.message)
        error.innerText = err.message
        error.style.display = 'block'
    } finally {
        authBtn.innerText = isRegistration ? 'Register' : 'Login'
        isAuthenticating = false
    }
}

function logout() {

}

async function fetchTodos() {
    isLoading = true
    try {
        const response = await fetch(apiBase + 'todos', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token')
                token = null
                authContent.style.display = 'block'
                nav.style.display = 'none'
                header.style.display = 'none'
                main.style.display = 'none'
                
                document.body.classList.remove('dashboard-mode')
                document.body.classList.add('auth-mode')
                return
            }
            throw new Error(`Failed to fetch todos: ${response.status}`)
        }
        
        const todosData = await response.json()
        todos = Array.isArray(todosData) ? todosData : []
    } catch (err) {
        console.error('Error fetching todos:', err)
        todos = []
    } finally {
        isLoading = false
        renderTodos()
    }
}

async function updateTodo(index) {
    try {
        const todo = todos.find(val => val.id === index);
        if (!todo) return;
        
        const newCompletedStatus = todo.completed ? 0 : 1;
        
        await fetch(apiBase + 'todos' + '/' + index, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                task: todo.task, 
                completed: newCompletedStatus 
            })
        })
        fetchTodos()
    } catch (err) {
        console.error('Error updating todo:', err)
    }
}

async function deleteTodo(index) {
    try {
        await fetch(apiBase + 'todos' + '/' + index, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        })
        fetchTodos()
    } catch (err) {
        console.error('Error deleting todo:', err)
    }
}

async function addTodo() {
    const todoInput = document.getElementById('todoInput')
    const task = todoInput.value.trim()

    if (!task) { return }

    try {
        await fetch(apiBase + 'todos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ task })
        })
        todoInput.value = ''
        fetchTodos()
    } catch (err) {
        console.error('Error adding todo:', err)
    }
}
if (token) {
    async function run() {
        await fetchTodos()
        showDashboard()
    }
    run()
}