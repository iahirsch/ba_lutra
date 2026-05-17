export function HubLights() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-4, 3, -4]} intensity={0.3} />
    </>
  );
}
