interface Recipe {
    id: string;
    title: string;
    ingredients: string;
    instructions: string;
}

let recipes: Recipe[] = JSON.parse(localStorage.getItem('recipes') || '[]');
let editingId: string | null = null;

const titleInput = document.getElementById('title') as HTMLInputElement;
const ingInput = document.getElementById('ingredients') as HTMLTextAreaElement;
const instInput = document.getElementById('instructions') as HTMLTextAreaElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const listDisplay = document.getElementById('recipe-list') as HTMLDivElement;

const render = (): void => {
    listDisplay.innerHTML = '';
    recipes.forEach(r => {
        const div = document.createElement('div');
        div.className = 'recipe-item';
        div.innerHTML = `
            <div class="recipe-header">
                <h3>${r.title}</h3>
                <div class="actions">
                    <button onclick="editRecipe('${r.id}')" class="btn-edit">Edit</button>
                    <button onclick="deleteRecipe('${r.id}')" class="btn-del">Delete</button>
                </div>
            </div>
            <p><strong>Ingredients:</strong></p>
            <pre>${r.ingredients}</pre>
            <p><strong>Instructions:</strong></p>
            <pre>${r.instructions}</pre>
        `;
        listDisplay.appendChild(div);
    });
    localStorage.setItem('recipes', JSON.stringify(recipes));
};

const clearForm = () => {
    titleInput.value = '';
    ingInput.value = '';
    instInput.value = '';
    editingId = null;
    saveBtn.textContent = 'Save Recipe';
};

saveBtn.onclick = () => {
    const title = titleInput.value.trim();
    const ingredients = ingInput.value.trim();
    const instructions = instInput.value.trim();

    if (!title || !ingredients || !instructions) return;

    if (editingId) {
        recipes = recipes.map(r => r.id === editingId ? { id: r.id, title, ingredients, instructions } : r);
    } else {
        recipes.push({ id: Date.now().toString(), title, ingredients, instructions });
    }

    clearForm();
    render();
};

(window as any).deleteRecipe = (id: string) => {
    recipes = recipes.filter(r => r.id !== id);
    render();
};

(window as any).editRecipe = (id: string) => {
    const r = recipes.find(rec => rec.id === id);
    if (!r) return;
    titleInput.value = r.title;
    ingInput.value = r.ingredients;
    instInput.value = r.instructions;
    editingId = id;
    saveBtn.textContent = 'Update Recipe';
    window.scrollTo(0, 0);
};

render();