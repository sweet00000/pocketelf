// py_worker.js
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide;
let pendingRequests = {};
let requestCounter = 0;

// 1. The Bridge Function: Python will `await` this!
self.ask_llm_bridge = function(systemPrompt, userPrompt) {
    return new Promise((resolve) => {
        const id = requestCounter++;
        pendingRequests[id] = resolve; // Save the resolve function
        
        // Ask the Main Thread to forward this to the AI Worker
        self.postMessage({ type: 'REQUEST_LLM', id: id, systemPrompt: systemPrompt, userPrompt: userPrompt });
    });
};

// 2. Logging Bridge
self.log_to_ui = function(msg, logType) {
    self.postMessage({ type: 'LOG', msg: msg, logType: logType });
};

// 3. Listen for messages from the Main Thread
self.onmessage = async (event) => {
    const data = event.data;

    if (data.type === 'INIT') {
        self.log_to_ui("[Py Worker] Booting Pyodide...", "sys-log");
        pyodide = await loadPyodide();
        
        await pyodide.runPythonAsync(`
            import js

            async def process_flow(user_msg, rag_context, system_prompt):
                combined_prompt = f"RAG CONTEXT:\\n{rag_context}\\n\\nUSER:\\n{user_msg}"
                
                js.log_to_ui("\\n[Router Node] Requesting LLM inference...", "sys-log")
                
                # 🚀 MAGIC: Python pauses here, waiting for the AI Web Worker to finish!
                response = await js.ask_llm_bridge(system_prompt, combined_prompt)
                
                js.log_to_ui(f"[PocketFlow Output]:\\n{response}\\n", "agent-log")
        `);
        self.postMessage({ type: 'INIT_DONE' });
    } 
    
    else if (data.type === 'RUN_FLOW') {
        // Trigger the Python function
        await pyodide.runPythonAsync(`await process_flow(${JSON.stringify(data.msg)}, ${JSON.stringify(data.rag)}, ${JSON.stringify(data.sys)})`);
    } 
    
    else if (data.type === 'LLM_REPLY') {
        // The AI Worker finished! Resolve the promise so Python can continue.
        if (pendingRequests[data.id]) {
            pendingRequests[data.id](data.text);
            delete pendingRequests[data.id];
        }
    }
};
