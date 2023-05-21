import { Box, Divider, IconButton, InputBase, Paper } from '@mui/material';
import { invoke } from '@tauri-apps/api';
import { useState } from 'react';
import SendIcon from '@mui/icons-material/Send';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import ChatMessageContainer from '../components/ChatMessageContainer';
import GifIcon from '@mui/icons-material/Gif';
import GifSearch from '../components/GifSearch';
import React from 'react';
import Sidebar from '../components/Sidebar';
import { RootState } from '../store/store';
import { useDispatch, useSelector } from 'react-redux';
import { TextMessage, addChatMessage } from '../store/features/users/chatMessageSlice';
import { formatBytes } from '../helper/Fomat';
import OutgoingMessageParser from '../helper/OutgoingMessageParser';

function Chat() {
    const [chatMessage, setChatMessage] = useState("");
    const [showGifSearch, setShowGifSearch] = useState(false);
    const [gifSearchAnchor, setGifSearchAnchor] = useState<HTMLElement>();

    const dispatch = useDispatch();
    const userInfo = useSelector((state: RootState) => state.reducer.userInfo);
    const channelInfo = useSelector((state: RootState) => state.reducer.channel);
    const messageLog = useSelector((state: RootState) => state.reducer.chatMessage);

    const currentChannel = channelInfo.find(e => e.channel_id === userInfo.currentUser?.channel_id)?.name;

    function pushChatMessage(message: TextMessage) {
        dispatch(addChatMessage(message));
    }

    function customChatMessage(data: string) {
        invoke('send_message', { chatMessage: data, channelId: userInfo.currentUser?.channel_id });
        console.log("customChatMessage", data);
        pushChatMessage({
            actor: userInfo.currentUser?.id || 0,
            sender: {
                user_id: userInfo.currentUser?.id || 0,
                user_name: userInfo.currentUser?.name || 'unknown'
            },
            channel_id: [0],
            tree_id: [0],
            message: data,
            timestamp: Date.now()
        })
        setChatMessage("");
    }

    function sendChatMessage(e: any) {
        let message = new OutgoingMessageParser(chatMessage)
            .parseLinks()
            .parseCommands()
            .parseMarkdown()
            .build();
        customChatMessage(message)
    }

    function keyDownHandler(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
        if (e && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage({});
        }
    }

    function uploadFile(e: any) {
        //TODO
    }

    function showGifPreview(e: any) {
        setShowGifSearch(!showGifSearch);
        setGifSearchAnchor(e.currentTarget)
    }

    function pasteEvent(event: any) {
        let items = event.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function () {
                    if (reader.result && (reader.result as string).length > 0x7fffff) {
                        customChatMessage("[[ Image too large ( " + formatBytes((reader.result as string).length) + " out of " + formatBytes(0x7fffff) + ") ]]");
                        return;
                    }
                    let img = '<img src="' + reader.result + '" />';
                    customChatMessage(img);
                };
            }
        }
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
            <Sidebar />
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <ChatMessageContainer messages={messageLog}></ChatMessageContainer>
                    <Box m={2} sx={{ display: 'flex' }}>
                        <Paper
                            component="form"
                            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400, flexGrow: 1 }}
                        >
                            <IconButton sx={{ p: '10px' }} aria-label="menu" onClick={uploadFile}>
                                <AddToPhotosIcon />
                            </IconButton>
                            <InputBase
                                sx={{ ml: 1, flex: 1 }}
                                placeholder={"Send Message to " + currentChannel}
                                inputProps={{ 'aria-label': 'Send Message to ' + currentChannel }}
                                onChange={e => setChatMessage(e.target.value)}
                                onKeyDown={keyDownHandler}
                                value={chatMessage}
                                onPaste={pasteEvent}
                                multiline
                            />
                            <IconButton onClick={showGifPreview}>
                                <GifIcon />
                            </IconButton>
                            <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                            <IconButton sx={{ p: '10px' }} aria-label="Send Message" onClick={sendChatMessage}>
                                <SendIcon />
                            </IconButton>
                        </Paper>
                    </Box>
                </Box>
                <GifSearch open={showGifSearch} anchor={gifSearchAnchor} />
            </Box>
        </Box>
    )
}

export default Chat;