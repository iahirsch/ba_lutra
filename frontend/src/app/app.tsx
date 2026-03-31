import { Canvas } from '@react-three/fiber';
import { Experience } from '../components/Experience';
import BuddySelector from '../components/BuddySelector';
import { useState } from 'react';
import {
  bodyOptions,
  mouthOptions,
  eyesOptions,
} from '../components/BuddyOptions';

export function App() {
  const [body, setBody] = useState('body01');
  const [mouth, setMouth] = useState('mouth01');
  const [eyes, setEyes] = useState('eyes01');

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{ position: [3, 3, 3] }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <color attach="background" args={['#333333']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <Experience body={body} mouth={mouth} eyes={eyes} />
      </Canvas>
      {/* Auswahlleiste am unteren Rand, außerhalb des Canvas */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          background: 'rgba(30,30,30,0.95)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          padding: '12px 0',
          zIndex: 10,
        }}
      >
        <BuddySelector
          label="Body"
          options={bodyOptions}
          selected={body}
          onSelect={setBody}
        />
        <BuddySelector
          label="Mouth"
          options={mouthOptions}
          selected={mouth}
          onSelect={setMouth}
        />
        <BuddySelector
          label="Eyes"
          options={eyesOptions}
          selected={eyes}
          onSelect={setEyes}
        />
      </div>
    </div>
  );
}

export default App;
