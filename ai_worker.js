// ai_worker.js
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0";

// Disable local model checks since we are in a browser
env.allowLocalModels = false;

let generator;

// Listen for messages from the Main Thread
self.onmessage = async (event) => {
    const { type, id, systemPrompt, userPrompt } = event.data;

    if (type === 'INIT') {
        self.postMessage({ type: 'LOG', msg: "[AI Worker] Downloading Model...", logType: "sys-log" });
        
        // We use SmolLM here for fast testing. Swap to Phi or Qwen when ready.
        generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', { //onnx-community/Phi-4-mini-instruct-web-q4f16
            dtype: 'q8', 
            device: 'wasm' 
        });
        
        self.postMessage({ type: 'INIT_DONE' });
    } 
    
    else if (type === 'GENERATE') {
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        const output = await generator(messages, {
            max_new_tokens: 256,
            temperature: 0.1
        });

        const replyText = output[0].generated_text.at(-1).content;
        
        // Send the result back to the Main Thread, attaching the original ID
        self.postMessage({ type: 'GENERATE_DONE', id: id, text: replyText });
    }
};
