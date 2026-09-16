import styled from 'styled-components';
import type { CardState } from '../game/models/game-state';

const images = import.meta.glob<string>('../assets/cards/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const rankNames: Record<CardState['rank'], string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
  '8': '8', '9': '9', '10': '10',
  J: 'jack', Q: 'queen', K: 'king', A: 'ace',
};

type CardProps = {
  className?: string;
} & (
  | { card: CardState; hidden?: false }
  | { hidden: true; card?: never }
);

const Face = styled.img`
  display: block;
  width: clamp(52px, 7vw, 80px);
  height: auto;
  aspect-ratio: 5 / 7;
  object-fit: contain;
  flex-shrink: 0;
`;

const Back = styled.span`
  display: block;
  width: clamp(52px, 7vw, 80px);
  aspect-ratio: 5 / 7;
  box-sizing: border-box;
  flex-shrink: 0;
  border: 3px solid #faf8ee;
  border-radius: 6px;
  background: repeating-linear-gradient(
    45deg, #244c3a, #244c3a 5px, #305c48 5px, #305c48 10px
  );
`;

export default function Card(props: CardProps) {
  if (props.hidden) {
    return <Back className={props.className} role="img" aria-label="Hidden card" />;
  }

  const { card, className } = props;
  const name = rankNames[card.rank];
  const src = images[`../assets/cards/${name}_of_${card.suit}.svg`];

  return (
    <Face
      className={className}
      src={src}
      alt={`${name} of ${card.suit}`}
      draggable={false}
    />
  );
}
