import React,{useState} from 'react';

const siteUrl='https://what-the-stuff.com/';
export default function ShareButton({text='Let’s get stuffing! Play What the STUFF!?',className=''}){
  const [message,setMessage]=useState('');
  const [manual,setManual]=useState(false);
  const [sharing,setSharing]=useState(false);
  async function share(){
    setSharing(true);setMessage('');setManual(false);
    try{
      if(navigator.share){
        try{
          await navigator.share({title:'What the STUFF!?',text,url:siteUrl});
          return;
        }catch(error){if(error.name==='AbortError')return;}
      }
      try{
        await navigator.clipboard.writeText(`${text}\n${siteUrl}`);
        setMessage('Copied!');
      }catch{
        setManual(true);setMessage('Copy this to share:');
      }
    }finally{setSharing(false);}
  }
  return <div className={`share-control ${className}`}>
    <button className="share-button" onClick={share} disabled={sharing} aria-label="Share What the STUFF!?">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>
      Share
    </button>
    <span role="status">{message}</span>
    {manual&&<textarea aria-label="Text to share" readOnly value={`${text}\n${siteUrl}`} onFocus={event=>event.target.select()}/>}
  </div>;
}
