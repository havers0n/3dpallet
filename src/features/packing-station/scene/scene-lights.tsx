export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[100, 150, 100]}
        intensity={0.8}
        castShadow
      />
      <directionalLight
        position={[-50, 80, -50]}
        intensity={0.3}
      />
    </>
  );
}
