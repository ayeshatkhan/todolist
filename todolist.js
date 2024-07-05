document.addEventListener('DOMContentLoaded', function() {
    const supabaseUrl = 'https://xslkeqowwshtdrsvnnjz.supabase.co'; // Replace with your Supabase URL
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbGtlcW93d3NodGRyc3Zubmp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI1NjA1OTMsImV4cCI6MjAyODEzNjU5M30.eCUVCrS_rCIStJRjHlhZADic9APitUaC6JgY4U47rIY'; // Replace with your Supabase Anon Key

    const { createClient } = supabase;

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const dateTimeText = document.getElementById('dateTime');

    // Fetch initial todos from Supabase
    getTodos();

    // Function to fetch todos from Supabase
    async function getTodos() {
        try {
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('*');

            if (error) {
                throw error;
            }

            taskList.innerHTML = ''; // Clear existing list items

            if (data) {
                data.forEach(todo => {
                    createTaskItem(todo);
                });
            }
        } catch (error) {
            console.error('Error fetching todos:', error);
        }
    }

    // Function to create a task list item
    function createTaskItem(todo) {
        const taskItem = document.createElement('li');

        // Get the current date and time
        const currentDate = new Date();
        const dateTimeString = currentDate.toLocaleString();

        taskItem.innerHTML = `
            <input type="checkbox" class="checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="task-text ${todo.completed ? 'completed' : ''}">${todo.task}</span>
            <button class="delete-btn">Delete</button>
            <ol class="subtasks"></ol> <!-- Ordered list for subtasks -->
        `;

        // Add event listener for checkbox click (toggle completed)
        taskItem.querySelector('.checkbox').addEventListener('change', async function() {
            const completed = this.checked;
            await updateTodo(todo.id, { completed }); // Update completed state in Supabase
            taskItem.querySelector('.task-text').classList.toggle('completed');

            if (completed) {
                // Move completed task to the bottom of the list
                taskList.appendChild(taskItem);
            } else {
                // Move incomplete task to the top of the list
                taskList.insertBefore(taskItem, taskList.firstChild);
            }

            // Update date and time below task list
            updateDateTime();
        });

        // Add event listener for delete button click
        taskItem.querySelector('.delete-btn').addEventListener('click', async function() {
            await deleteTodo(todo.id);
            taskItem.remove();

            // Update date and time below task list
            updateDateTime();
        });

        taskList.insertBefore(taskItem, taskList.firstChild); // Add task item to the top of the list initially

        // Update date and time below task list
        updateDateTime();

        // Add subtasks
        if (todo.subtasks && todo.subtasks.length > 0) {
            const subtasksList = taskItem.querySelector('.subtasks');
            todo.subtasks.forEach(subtask => {
                const subtaskItem = document.createElement('li');
                subtaskItem.textContent = subtask;
                subtasksList.appendChild(subtaskItem);
            });
        }
    }

    // Function to add a new task (including Supabase insertion)
    async function addTask() {
        const taskText = taskInput.value.trim();
        if (!taskText) return;

        try {
            // Insert new todo in Supabase
            const { error } = await supabaseClient
                .from('tasks')
                .insert([{ task: taskText, completed: false }]);

            if (error) {
                throw error;
            }

            // Check if the inserted todo exists in the database
            const { data: newTodoData, error: newTodoError } = await supabaseClient
                .from('tasks')
                .select('*')
                .eq('task', taskText)
                .single();

            if (newTodoError) {
                throw newTodoError;
            }

            if (newTodoData) {
                const newTodo = newTodoData; // Get the newly inserted todo
                createTaskItem(newTodo); // Create and display the new task item
            } else {
                throw new Error('No data returned after inserting todo');
            }

            taskInput.value = ''; // Clear the input field
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    }

    // Function to update a todo's completed state in Supabase
    async function updateTodo(id, updates) {
        try {
            const { error } = await supabaseClient
                .from('tasks')
                .update(updates)
                .eq('id', id);

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    }

    // Function to delete a todo from Supabase
    async function deleteTodo(id) {
        try {
            const { error } = await supabaseClient
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    }

    // Function to update date and time below task list
    function updateDateTime() {
        const currentDate = new Date();
        const dateTimeString = currentDate.toLocaleString();
        dateTimeText.textContent = `Date and Time: ${dateTimeString}`;
    }

    // Event listener for add task button
    addTaskBtn.addEventListener('click', addTask);

    // Event listener for pressing Enter key in the input field
    taskInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            addTask();
        }
    });
});
