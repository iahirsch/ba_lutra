import { useGLTF } from '@react-three/drei';

function Part({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  return <primitive object={scene} />;
}

export function Buddy({
  body,
  mouth,
  eyes,
}: {
  body: string;
  mouth: string;
  eyes: string;
}) {
  return (
    <group>
      <Part path={`/assets/Buddy/glp/body/${body}.glb`} />
      <Part path={`/assets/Buddy/glp/mouth/${mouth}.glb`} />
      <Part path={`/assets/Buddy/glp/eyes/${eyes}.glb`} />
    </group>
  );
}

export default Buddy;
