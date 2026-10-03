import { useState, useEffect } from 'react';

import { Snippet } from '@nextui-org/snippet';
import { Button } from '@nextui-org/button';

function CommandDisplay({setIsLightBulbOn,setIsFanOn,setIsLockOn}:any) {
    const [translatedText, setTranslatedText] = useState('');
    const [snippetColor, setSnippetColor]:any = useState('default')
    function playCommandSuccess(command:string){
        resetText();
        setTranslatedText(`[${command}] Detected`)
       
        setSnippetColor('success');
        
        const interval = setInterval(() => {
            setSnippetColor('default');
            setTranslatedText('')
            clearInterval(interval);
        }, 1500);
    }
    function resetText() {
        fetch('http://localhost:5000/reset_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Text reset successfully');
                }
            })
            .catch(error => console.error('Error resetting text:', error));
    }
    useEffect(() => {
        
        
        const fetchText = () => {
          if(translatedText[0]!='['){
            fetch('http://localhost:5000/get_text')
                .then(response => response.json())
                .then(data => setTranslatedText(data.text))
                .catch(error => console.error('Error fetching translated text:', error));
            }
        };

        const intervalId = setInterval(fetchText, 1000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(()=>{
        if(translatedText=="lights on" || translatedText=="lightson"){
            playCommandSuccess('Lights On')
            setIsLightBulbOn(true)
            
        }
        else if(translatedText=="lights off" || translatedText=="lightsoff"){
            playCommandSuccess('Lights Off')
            setIsLightBulbOn(false)
        }
        else if(translatedText=="fan on"){
            playCommandSuccess('Fan On')
            setIsFanOn(true)
        }
        else if(translatedText=="fan off"){
            playCommandSuccess('Fan Off')
            setIsFanOn(false)
        }
        else if(translatedText=="lock on"){
            playCommandSuccess('Lock On')
            setIsLockOn(true)
        }
        else if(translatedText=="lock off"){
            playCommandSuccess('Lock Off')
            setIsLockOn(false)
        }
    },[translatedText])

    return (
        <div className='flex justify-center items-center gap-3'>
            <Snippet hideCopyButton color={snippetColor}>
                <span>Smart Command: {translatedText}</span>
            </Snippet>
            <Button isIconOnly size='sm' variant='bordered' color='default' onClick={resetText}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.6054 7.70537C16.8708 6.96718 15.9972 6.38183 15.0351 5.98308C14.073 5.58435 13.0414 5.38013 12 5.38222C9.89717 5.38222 7.88054 6.21757 6.39364 7.70446C4.90674 9.19136 4.07141 11.208 4.07141 13.3107C4.07141 15.4146 4.9064 17.4323 6.39299 18.9209C7.87958 20.4095 9.89622 21.2472 12 21.25C14.1037 21.2472 16.1204 20.4095 17.607 18.9209C19.0936 17.4323 19.9286 15.4146 19.9286 13.3107" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M16.8808 2.75L17.8292 6.60772C17.913 6.94965 17.858 7.31085 17.6763 7.61238C17.4945 7.9139 17.2009 8.13125 16.8594 8.21689L12.9911 9.16532" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            </Button>
        </div>
    );
};




export default CommandDisplay;
