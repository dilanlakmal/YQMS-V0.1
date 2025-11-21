import { Link } from 'react-router-dom'
import './homepage.css'
import { TypeAnimation } from 'react-type-animation';
import { useState } from 'react';
// import { useAuth } from '@clerk/clerk-react';


const Homepage = () => {

  // const { getToken } = useAuth();

  // const test = async () => {
  //  const token = await getToken();
  //  await fetch('http://localhost:3000/api/test', {
  //     method: 'GET',
  //     headers: {
  //       "Authorization": `Bearer ${token}`
  //     }
  //   })
  // };

  const [typingStatus, setTypingStatus] = useState('human1');
  return (
    <div className='homepage'>
      <img src="/orbital.png" alt="" className='orbital'/>
        <div className="left">
            <h1>YAI Chatbot</h1>
            <h2>All Service in Yorkmars</h2>
            <h3>To supports each departments in YorkMars companies, We can asks any Question in this Chatbot</h3>

            {/* <button>Get Started</button> */}

            <Link to="/dashboard"> Get Started</Link>
            {/* <button onClick={test}>Testing Auth</button> */}

        </div>
        <div className="right">
          <div className='imgContainer'>
            <div className='bgContainer'>
              <div className='bg'> </div>
            </div>
              <img src="/bot.png" alt="" className='bot'/>
              <div className="chat">
                <img src={typingStatus === 'human1' ? "/human1.jpeg" : typingStatus === 'human2' ? "/human2.jpeg" : "/bot.png"} alt="" />  
                {/* <img src="/bot.png" alt="" /> */}
                <TypeAnimation
                  sequence={[
                    // Same substring at the start will only be typed out once, initially
                    'Human produce food for Mice',
                    2000, () =>{
                      setTypingStatus('bot');

                    },// wait 1s before replacing "Mice" with "Hamsters"
                    'Bot produce food for Hamsters',
                    2000, () =>{
                      setTypingStatus('human2');

                    },
                    'Human2:  produce food for Guinea Pigs',
                    2000,() =>{
                      setTypingStatus('bot');

                    },
                    'Bot produce food for Chinchillas',
                    2000,() =>{
                      setTypingStatus('human1');

                    }
                  ]}
                  wrapper="span"
                  repeat={Infinity}
                  cursor={true}
                  omitDeletionAnimation={true}
                />
              </div>
            </div>
          </div>
          <div className='terms'>
            <img src="/logo.png" alt="" />
            <div className='links'>
              <Link to="/">Terms of Service</Link>
              <span> | </span>
              <Link to="/">Privacy Policy</Link>
            </div>
          </div>
        </div>
  )
}

export default Homepage