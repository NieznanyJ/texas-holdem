import { useId, useState } from 'react';
import type { SubmitEvent } from 'react';
import styled from 'styled-components';

export type RoomJoinMode = 'create' | 'join';

export type RoomFormData =
    | { mode: 'create'; name: string }
    | { mode: 'join'; roomId: string };

interface RoomFormProps {
    mode: RoomJoinMode;
    onSubmit: (data: RoomFormData) => void | Promise<void>;
    disabled?: boolean;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
  padding: 24px;
  border: 1px solid #42604d;
  border-radius: 16px;
  background: #183426;
  color: #fff;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
`;

const Description = styled.p`
  margin: 0;
  color: #c2d0c6;
  line-height: 1.5;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #799583;
  border-radius: 8px;
  background: #10251b;
  color: white;
  font: inherit;

  &::placeholder { color: #a9bdb0; }
  &:focus-visible { outline: 2px solid #d4af37; outline-offset: 2px; }
  &:disabled { opacity: 0.6; }
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #d4af37;
  color: #171717;
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) { background: #e8c54a; }
  &:focus-visible { outline: 2px solid white; outline-offset: 3px; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: #ffb4b4;
`;

function RoomForm({ mode, onSubmit, disabled = false }: RoomFormProps) {
    const id = useId();
    const [value, setValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isCreate = mode === 'create';

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (disabled || isSubmitting) return;

        const trimmedValue = value.trim();
        if (!trimmedValue) {
            setError(isCreate ? 'Room name.' : 'Room id.');
            return;
        }

        setError(null);
        setIsSubmitting(true);
        try {
            await onSubmit(
                isCreate
                    ? { mode: 'create', name: trimmedValue }
                    : { mode: 'join', roomId: trimmedValue },
            );
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'The operation could not be preformet. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form onSubmit={handleSubmit} aria-labelledby={id + '-title'} aria-busy={isSubmitting}>
            <Title id={id + '-title'}>{isCreate ? 'Utwórz pokój' : 'Dołącz do pokoju'}</Title>
            <Description>
                {isCreate ? 'Name your room and invite friends.' : 'Enter room id .'}
            </Description>
            <Label htmlFor={id}>
                {isCreate ? 'Room name' : 'Room id'}
                <Input
                    id={id}
                    name={isCreate ? 'name' : 'roomId'}
                    type="text"
                    placeholder={isCreate ? 'Night poker' : 'Paste room id here'}
                    value={value}
                    onChange={(event) => { setValue(event.target.value); setError(null); }}
                    disabled={disabled || isSubmitting}
                    required
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? id + '-error' : undefined}
                />
            </Label>
            {error && <ErrorMessage id={id + '-error'} role="alert">{error}</ErrorMessage>}
            <Button type="submit" disabled={disabled || isSubmitting || !value.trim()}>
                {isSubmitting ? 'Connecting...' : isCreate ? 'Create and join' : 'Join'}
            </Button>
        </Form>
    );
}

export default RoomForm;
