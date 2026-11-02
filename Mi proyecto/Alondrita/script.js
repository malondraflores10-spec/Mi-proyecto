let apiKey = localStorage.getItem('gemini_api_key') || '';

const SYSTEM_PROMPT = `
Eres un Tutor Académico Directo de nivel profesional especializado en la enseñanza socrática para cualquier disciplina del conocimiento. Tu objetivo principal es guiar al estudiante para que razone, analice y construya sus propias soluciones paso a paso.

Reglas estrictas de la "Prisión del Agente":
1. Guiar, no resolver: Bajo ninguna circunstancia debes entregar respuestas cerradas, ensayos completos, ni bloques de código final resueltos de golpe.
2. Retroalimentación por Pasos: Ante cualquier consulta, desglosa la explicación en preguntas guía y explicaciones de conceptos clave.
3. Adaptabilidad de Dominio: Asume el rol experto del área seleccionada (como ASP.NET, SQL Server, matemáticas o ciencias), pero aplicando estrictamente la restricción pedagógica.
4. Resistencia a la Presión: Si el usuario exige una solución directa ("hazmelo todo", "dame el código listo"), mantén el rol educativo y redirígelo con un paso analítico intermedio.
`;

const chatBox = document.getElementById('chatBox');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const configBtn = document.getElementById('configBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const materiaSelect = document.getElementById('materiaSelect');

let history = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Entendido. Operando bajo los parámetros de tutoría socrática adaptativa y contención de agente." }] }
];

configBtn.addEventListener('click', () => {
    const key = prompt("Ingresa tu API Key de Google Gemini (se almacena de forma segura en tu navegador):", apiKey);
    if (key !== null) {
        apiKey = key.trim();
        localStorage.setItem('gemini_api_key', apiKey);
        alert("¡API Key guardada con éxito!");
    }
});

clearChatBtn.addEventListener('click', () => {
    if (confirm("¿Deseas reiniciar la sesión de chat?")) {
        chatBox.innerHTML = `
            <div class="bg-purple-800/80 border border-purple-700 p-4 rounded-2xl text-purple-100 max-w-[85%] shadow">
                <strong>Tutor:</strong> Sesión reiniciada. ¿En qué tema o desafío académico deseas trabajar ahora?
            </div>
        `;
        history = [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            { role: "model", parts: [{ text: "Sesión reiniciada correctamente." }] }
        ];
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    if (!apiKey) {
        alert("Por favor, haz clic en 'Configurar API Key' en la esquina superior derecha antes de enviar mensajes.");
        return;
    }

    appendMessage('Tú', text, 'user');
    userInput.value = '';

    const materiaActual = materiaSelect.value;
    const promptEstructurado = `[Dominio Activo: ${materiaActual}] ${text}`;
    history.push({ role: "user", parts: [{ text: promptEstructurado }] });

    const loadingDiv = appendMessage('Tutor', 'Analizando consulta y preparando guía socrática...', 'assistant');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: history })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const botReply = data.candidates[0].content.parts[0].text;

        loadingDiv.innerHTML = `<strong>Tutor:</strong> ${botReply.replace(/\n/g, '<br>')}`;
        history.push({ role: "model", parts: [{ text: botReply }] });
    } catch (err) {
        loadingDiv.innerHTML = `<span class="text-red-300">⚠️ Error de conexión o API Key inválida. Por favor verifica tu clave.</span>`;
    }
});

function appendMessage(sender, text, role) {
    const div = document.createElement('div');
    const isUser = role === 'user';
    div.className = `${isUser ? 'ml-auto bg-purple-700/90 border-purple-600' : 'mr-auto bg-purple-800/90 border-purple-700'} border p-4 rounded-2xl text-purple-100 max-w-[85%] shadow`;
    div.innerHTML = `<strong>${sender}:</strong> ${text.replace(/\n/g, '<br>')}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
}
