import styled from 'styled-components';
import RoomForm, { type RoomFormData } from '../components/lobby/RoomForm';
import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import { useNavigate } from 'react-router-dom';

const Container = styled.main`
  background: #10251b;
  color: white;
  padding: 32px;
  display: flex;
  justify-content: space-between;
`;



const Title = styled.h1`
  font-size: 32px;
  margin-bottom: 24px;
`;



export default function LobbyPage() {
    const navigate = useNavigate();
    const [connected, setConnected] = useState(socket.connected);

    const [userId] = useState(() => {
        const saved = sessionStorage.getItem('poker-user-id');
        if (saved) return saved;

        const id = crypto.randomUUID();
        sessionStorage.setItem('poker-user-id', id);
        return id;
    });

    useEffect(() => {
        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, [])

    async function handleSubmit(data: RoomFormData): Promise<void> {
        if (!socket.connected) {
            throw new Error('Brak połączenia z serwerem.');
        }

        try {
            let targetRoomId: string;

            if (data.mode === 'create') {
                const response: { roomId: string } = await socket
                    .timeout(5000)
                    .emitWithAck('room:create', { name: data.name, userId });

                targetRoomId = response.roomId;
            } else {
                targetRoomId = data.roomId;
            }

            const response: { success: boolean } = await socket
                .timeout(5000)
                .emitWithAck('room:join', { roomId: targetRoomId, userId });

            if (!response.success) {
                throw new Error('Cound no connect.');
            }

            
            navigate(`/room/${targetRoomId}`);
        } catch {
            throw new Error(
                'Could not connect or the server did not respond. Check your connection and room id.',
            );
        }
    }



    return (
        <>
            <Title>Texas Hold’em</Title>
            <Container>
                <RoomForm mode="create" onSubmit={handleSubmit} disabled={!connected} />
                <RoomForm mode="join" onSubmit={handleSubmit} disabled={!connected} />
            </Container>
        </>
    );
}