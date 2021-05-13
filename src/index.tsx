import { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import * as esbuild from 'esbuild-wasm';

const App = () =>{

    const ref = useRef<any>();
    const [input, setInput] = useState('');
    const [code, setCode] = useState('');

    const onClickHandler = async () => {
        if(!ref.current) {
            return;
        }

        const res = await ref.current.transform(input, {
            loader: 'jsx',
            target: 'es2015'
        })

        setCode(res.code);
    }

    const startService = async () => {
        ref.current = await esbuild.startService({
            worker: true,
            wasmURL: '/esbuild.wasm'
        })
    }

    useEffect(() => {
        startService();
    }, [])

    return (
        <div>
            <textarea value = {input} onChange = {e => setInput(e.target.value)}></textarea>
            <div>
                <button onClick = {onClickHandler}>Submit</button>
            </div>
            <pre>{code}</pre>
        </div>
    )
}

ReactDOM.render(<App/>, document.querySelector('#root'));