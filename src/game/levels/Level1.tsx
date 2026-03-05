import { useGameStore } from '../../store/useGameStore';
import Block from '../components/Block';
import Player from '../components/Player';
import DimensionRift from '../components/DimensionRift';
import CameraController from '../systems/CameraController';
import EditorCursor from './EditorCursor';
import Enemy from '../components/Enemy';
import PushableBlock from '../components/PushableBlock';
import Coin from '../components/Coin';
import Flag from '../components/Flag';
import SpawnPoint from '../components/SpawnPoint';
import Spike from '../components/Spike';
import MovingPlatform from '../components/MovingPlatform';
import Lamp from '../components/Lamp';
import Checkpoint from '../components/Checkpoint';
import Background from '../components/Background';

export default function Level1() {
  const blocks = useGameStore(s => s.blocks);
  const gameState = useGameStore(s => s.gameState);
  const isPublishing = useGameStore(s => s.isPublishing);
  const buildDepth = useGameStore(s => s.buildDepth);

  return (
    <>
      <CameraController />
      <Background />
      {(gameState === 'PLAYING' || gameState === 'PAUSE' || gameState === 'WIN') && <Player />}
      {gameState === 'EDITOR' && !isPublishing && (
        <>
          <EditorCursor />
          <group name="gridHelper">
            {/* Grille au sol fixe */}
            <gridHelper args={[100, 100, 0xffffff, 0x555555]} position={[0, -0.5, 0]} />
            {/* Grille verticale Z dynamique (Couleur Bleu Holographique/Ciel) */}
            <gridHelper args={[100, 100, 0x00aaff, 0x004488]} position={[0, 0, buildDepth]} rotation={[Math.PI / 2, 0, 0]} />
          </group>
        </>
      )}

      {blocks.map(block => {
        if (block.type === 'rift') {
          return <DimensionRift key={block.id} id={block.id} position={block.position} />;
        }
        if (block.type === 'goomba') {
          return <Enemy key={block.id} id={block.id} position={block.position} />;
        }
        if (block.type === 'pushable') {
          return <PushableBlock key={block.id} id={block.id} position={block.position} />;
        }
        if (block.type === 'coin') {
          return <Coin key={block.id} id={block.id} position={block.position} />;
        }
        if (block.type === 'flag') {
          return <Flag key={block.id} id={block.id} position={block.position} />;
        }
        if (block.type === 'spawn') {
          return <SpawnPoint key={block.id} id={block.id} position={block.position} />;
        }
        if (block.type === 'spike') {
          return <Spike key={block.id} position={block.position} />;
        }
        if (block.type === 'platform') {
          return <MovingPlatform key={block.id} position={block.position} />;
        }
        if (block.type === 'lamp') {
          return <Lamp key={block.id} id={block.id} position={block.position} />;
        }
        if (block.type === 'checkpoint') {
          return <Checkpoint key={block.id} position={block.position} />;
        }
        return <Block key={block.id} id={block.id} position={block.position} type={block.type} />;
      })}
    </>
  );
}
