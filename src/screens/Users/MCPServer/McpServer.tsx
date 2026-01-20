import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  FlatList,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  ListRenderItem,
} from 'react-native';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import Fonts from '../../../theme/fonts';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import ThinkingDots from './components/ThinkingDots';
import EventSource, { EventSourceListener } from 'react-native-sse';
import { getAiTextStream, getAiHistory } from '../../../api/apiService';

interface ToolUsed {
  tool: string;
  tool_input?: any;
  tool_output?: string;
  timestamp?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  inputType?: 'text';
  tools?: ToolUsed[];
  isStreaming?: boolean;
}

const McpServer = () => {
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [streaming, setStreaming] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const fetchHistory = async (pageNumber: number) => {
    try {
      if (pageNumber === 1) setLoadingHistory(true);

      const response = await getAiHistory(pageNumber);

      if (response && response.history) {
        const newMessages: ChatMessage[] = [];
        response.history.forEach((item: any) => {
          const timestamp = item.timestamp || Date.now().toString();
          // Add User Message
          newMessages.push({
            id: 'u_' + timestamp + Math.random(),
            type: 'user',
            text: item.user_query,
            inputType: 'text', // Assuming text for history
          });
          // Add AI Message
          newMessages.push({
            id: 'a_' + timestamp + Math.random(),
            type: 'ai',
            text: item.ai_response,
          });
        });

        // If API returns oldest -> newest, we reverse to get newest -> oldest for Inverted List
        const reversedMessages = newMessages.reverse();

        if (pageNumber === 1) {
          setMessages(reversedMessages);
        } else {
          setMessages(prev => [...prev, ...reversedMessages]);
        }

        setHasNextPage(response.has_next);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      if (pageNumber === 1) setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const stopGeneration = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setUploading(false);
    setStreaming(false);
  };

  const streamChat = async (payload: string) => {
    try {
      setUploading(true);
      setStreaming(true);

      const eventSource = await getAiTextStream(payload);

      eventSourceRef.current = eventSource;

      if (!eventSource) {
        Alert.alert('Error', 'Failed to initialize chat stream.');
        setUploading(false);
        setStreaming(false);
        return;
      }

      console.log('EventSource initialized:', eventSource);
      eventSourceRef.current = eventSource;

      // Add optimistic user message
      setMessages(prev => [
        {
          id: Date.now().toString() + Math.random().toString(),
          type: 'user',
          text: payload,
          inputType: 'text',
        },
        ...prev,
      ]);

      let currentAiMessageId: string | null = null;
      let aiMessageText = '';

      const listener: EventSourceListener = event => {
        console.log('SSE Event Received:', event.type, (event as any).data);
        if (event.type === 'open') {
          console.log('Open SSE connection.');
          setUploading(false);
        } else if (event.type === 'error') {
          console.error('Connection error:', event);
          setUploading(false);
          setStreaming(false);
          eventSource.close();

          const errorEvent = event as any;
          if (errorEvent.xhrStatus === 429) {
            Alert.alert(
              'Daily Limit Reached',
              'You have used all your daily tokens. Please try again tomorrow.',
            );
          } else if (currentAiMessageId == null) {
            Alert.alert('Error', 'Connection failed');
          }
        }
      };

      eventSource.addEventListener('open', listener);
      eventSource.addEventListener('error', listener);

      // Handle 'text' (Streaming content)
      eventSource.addEventListener('text' as any, (event: any) => {
        try {
          const data = JSON.parse(event.data);
          const chunk = data.content || data.text;

          if (!currentAiMessageId) {
            const newId = Date.now().toString();
            currentAiMessageId = newId;
            aiMessageText = chunk || '';
            setMessages(prev => [
              {
                id: newId,
                type: 'ai',
                text: aiMessageText,
                isStreaming: true,
                tools: [],
              },
              ...prev,
            ]);
          } else {
            aiMessageText += chunk || '';
            setMessages(prev =>
              prev.map(m => {
                if (m.id === currentAiMessageId) {
                  return { ...m, text: aiMessageText };
                }
                return m;
              }),
            );
          }
        } catch (e) {
          console.error('Error parsing text event:', e);
        }
      });

      // Handle 'tool_start'
      eventSource.addEventListener('tool_start' as any, (event: any) => {
        console.log('SSE Event [tool_start]:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (!currentAiMessageId) {
            const newId = Date.now().toString();
            currentAiMessageId = newId;
            setMessages(prev => [
              {
                id: newId,
                type: 'ai',
                text: '',
                isStreaming: true,
                tools: [{ tool: data.tool, tool_input: data.input }],
              },
              ...prev,
            ]);
          } else {
            setMessages(prev =>
              prev.map(m => {
                if (m.id === currentAiMessageId) {
                  const tools = m.tools ? [...m.tools] : [];
                  tools.push({ tool: data.tool, tool_input: data.input });
                  return { ...m, tools };
                }
                return m;
              }),
            );
          }
        } catch (e) {
          console.error('Error parsing tool_start:', e);
        }
      });

      // Handle 'tool_end'
      eventSource.addEventListener('tool_end' as any, (event: any) => {
        console.log('SSE Event [tool_end]:', event.data);
      });

      // Handle 'usage'
      eventSource.addEventListener('usage' as any, (event: any) => {
        console.log('SSE Event [usage]:', event.data);
        console.log('Usage stats:', event.data);
      });

      // Handle 'done'
      eventSource.addEventListener('done' as any, () => {
        console.log('Stream done.');
        setStreaming(false);
        eventSource.close();
      });
    } catch (error) {
      console.error('Failed to start stream:', error);
      setUploading(false);
      setStreaming(false);
      Alert.alert('Error', 'Could not start chat stream.');
    }
  };

  const sendText = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    Keyboard.dismiss();
    streamChat(textToSend);
  };

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => {
    const isUser = item.type === 'user';

    if (isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <View
            style={[
              styles.userMessageBubble,
              { backgroundColor: COLORS.primary },
            ]}
          >
            <Text style={styles.userMessageText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={{ marginBottom: 16 }}>
        <Animatable.View
          animation="fadeInLeft"
          duration={500}
          style={styles.aiMessageContainer}
        >
          <View style={[styles.aiMessageBubble, THEMESHADOW.shadow]}>
            <Text style={styles.aiMessageText}>{item.text}</Text>
          </View>
        </Animatable.View>
        {__DEV__ && item.tools && item.tools.length > 0 && (
          <Animatable.View animation="fadeInUp" style={styles.toolsContainer}>
            <Text style={styles.toolsLabel}>ACTIONS TAKEN</Text>
            <View style={styles.toolsList}>
              {item.tools.map((t, index) => (
                <View key={index} style={styles.toolChip}>
                  <Ionicons
                    name="flash-outline"
                    size={12}
                    color={COLORS.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.toolText}>{t.tool}</Text>
                </View>
              ))}
            </View>
          </Animatable.View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <UserCustomHeader title="MCP Assistant" showBackButton={true} />

      <View style={styles.contentContainer}>
        {messages.length === 0 && !uploading && !streaming ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="sparkles"
                size={40}
                color={COLORS.gradientStart}
              />
            </View>
            <Text style={styles.welcomeTitle}>Here to help</Text>
            <Text style={styles.welcomeText}>Ask about Pujas.</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            inverted
            onEndReached={() => {
              if (hasNextPage && !loadingHistory) {
                fetchHistory(page + 1);
              }
            }}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              uploading && !streaming ? (
                <View style={styles.uploadingContainer}>
                  <ThinkingDots />
                </View>
              ) : null
            }
            ListFooterComponent={
              loadingHistory && page > 1 ? (
                <View style={{ padding: 10 }}>
                  <Text style={{ textAlign: 'center', color: '#999' }}>
                    Loading more...
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Interaction Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputWrapper}>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Message..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={300}
              />
            </View>

            {uploading || streaming ? (
              <TouchableOpacity
                onPress={stopGeneration}
                activeOpacity={0.8}
                style={styles.micButton}
              >
                <Ionicons name="square" size={24} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={sendText}
                activeOpacity={0.8}
                style={[
                  styles.micButton,
                  { opacity: inputText.trim().length > 0 ? 1 : 0.5 },
                ]}
                disabled={inputText.trim().length === 0}
              >
                <Ionicons name="send" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default McpServer;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
    overflow: 'hidden',
  },
  chatContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  welcomeTitle: {
    fontFamily: Fonts.Sen_Bold,
    fontSize: 20,
    color: '#333',
    marginBottom: 8,
  },
  welcomeText: {
    fontFamily: Fonts.Sen_Regular,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginBottom: 8,
    marginRight: 4,
  },
  userMessageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderBottomRightRadius: 2,
    minWidth: 50,
  },
  userMessageText: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_Regular,
    fontSize: 15,
  },

  aiMessageContainer: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  aiMessageBubble: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    flex: 1,
  },
  aiMessageText: {
    color: '#333',
    fontFamily: Fonts.Sen_Regular,
    fontSize: 15,
    lineHeight: 22,
  },
  toolsContainer: {
    marginLeft: 36,
    marginTop: 8,
    marginBottom: 4,
  },
  toolsLabel: {
    fontSize: 10,
    fontFamily: Fonts.Sen_Bold,
    color: '#999',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  toolsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  toolText: {
    fontSize: 11,
    fontFamily: Fonts.Sen_Medium,
    color: '#2E7D32',
  },
  uploadingContainer: {
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    marginTop: 0,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.Sen_Regular,
    fontSize: 16,
    color: '#333',
    maxHeight: 120,
    paddingVertical: 8,
  },

  inlineSendButton: {
    padding: 8,
    marginLeft: 4,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
