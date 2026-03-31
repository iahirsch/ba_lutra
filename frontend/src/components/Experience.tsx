import { OrbitControls } from '@react-three/drei';
import Buddy from './Buddy';

type ExperienceProps = {
  body: string;
  mouth: string;
  eyes: string;
};

export const Experience = ({ body, mouth, eyes }: ExperienceProps) => {
  return (
    <>
      <OrbitControls />
      <Buddy body={body} mouth={mouth} eyes={eyes} />
    </>
  );
};
