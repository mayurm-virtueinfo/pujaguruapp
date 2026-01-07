import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Alert,
  FlatList,
  Animated,
  Easing,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  ListRenderItem,
} from 'react-native';
import {
  useAudioRecorder,
  AudioSourceAndroidType,
  AudioEncoderAndroidType,
  OutputFormatAndroidType,
} from 'react-native-nitro-sound';
import RNFS from 'react-native-fs';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { COLORS, THEMESHADOW } from '../../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserCustomHeader from '../../../components/UserCustomHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import Fonts from '../../../theme/fonts';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import ThinkingDots from './components/ThinkingDots';
import Waveform from './components/Waveform';
import EventSource, { EventSourceListener } from 'react-native-sse';
import {
  getAiVoiceStream,
  getAiTextStream,
  getAiHistory,
} from '../../../api/apiService';

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
  inputType?: 'voice' | 'text';
  tools?: ToolUsed[];
  isStreaming?: boolean;
}

const McpServer = () => {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [inputText, setInputText] = useState('');
  const [streaming, setStreaming] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
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

  const { startRecorder, stopRecorder } = useAudioRecorder();

  useEffect(() => {
    checkPermission();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    let animationLoop: Animated.CompositeAnimation;
    if (recording) {
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animationLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animationLoop) animationLoop.stop();
    };
  }, [recording]);

  const checkPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);
        if (
          grants['android.permission.RECORD_AUDIO'] ===
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          setPermissionGranted(true);
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      const result = await check(PERMISSIONS.IOS.MICROPHONE);
      if (result === RESULTS.GRANTED) setPermissionGranted(true);
      else {
        const requestResult = await request(PERMISSIONS.IOS.MICROPHONE);
        if (requestResult === RESULTS.GRANTED) setPermissionGranted(true);
      }
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      await checkPermission();
      if (!permissionGranted) {
        Alert.alert('Permission Required', 'Microphone access is needed.');
        return;
      }
    }

    try {
      setInputText('');
      setRecording(true);

      const filePath = RNFS.CachesDirectoryPath + '/test.wav';

      await startRecorder(filePath, {
        AudioSourceAndroid: AudioSourceAndroidType.VOICE_RECOGNITION,
        AudioSamplingRate: 16000,
        AudioChannels: 1,
        OutputFormatAndroid: OutputFormatAndroidType.DEFAULT,
        AudioEncoderAndroid: AudioEncoderAndroidType.DEFAULT,
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecording(false);
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setRecording(false);
      const audioFile = await stopRecorder();
      if (audioFile) {
        streamChat(audioFile, true);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const stopGeneration = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setUploading(false);
    setStreaming(false);
  };

  const streamChat = async (payload: string, isVoice: boolean) => {
    try {
      setUploading(true);
      setStreaming(true);

      const eventSource = isVoice
        ? await getAiVoiceStream(payload)
        : await getAiTextStream(payload);

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
      if (isVoice) {
        setMessages(prev => [
          {
            id: Date.now().toString() + Math.random().toString(),
            type: 'user',
            text: 'Thinking...',
            inputType: 'voice',
          },
          ...prev,
        ]);
      } else {
        setMessages(prev => [
          {
            id: Date.now().toString() + Math.random().toString(),
            type: 'user',
            text: payload,
            inputType: 'text',
          },
          ...prev,
        ]);
      }

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
          if (currentAiMessageId == null) {
            Alert.alert('Error', 'Connection failed');
          }
        }
      };

      eventSource.addEventListener('open', listener);
      eventSource.addEventListener('error', listener);

      // Handle 'transcription'
      eventSource.addEventListener('transcription' as any, (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.text) {
            setMessages(prev => {
              const newMsgs = [...prev];
              const placeholderIndex = newMsgs.findIndex(
                m =>
                  m.type === 'user' &&
                  m.text === 'Thinking...' &&
                  m.inputType === 'voice',
              );

              if (placeholderIndex !== -1) {
                newMsgs[placeholderIndex] = {
                  ...newMsgs[placeholderIndex],
                  text: data.text,
                };
              }
              return newMsgs;
            });
          }
        } catch (e) {
          console.error('Error parsing transcription:', e);
        }
      });

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
      eventSource.addEventListener('tool_end' as any, (event: any) => {});

      // Handle 'usage'
      eventSource.addEventListener('usage' as any, (event: any) => {
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
    streamChat(textToSend, false);
  };

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => {
    const isUser = item.type === 'user';

    if (isUser) {
      return (
        <Animatable.View
          animation="fadeInRight"
          duration={500}
          style={styles.userMessageContainer}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userMessageBubble}
          >
            <Text style={styles.userMessageText}>{item.text}</Text>
            <View style={styles.messageMetadata}>
              {item.inputType && (
                <Ionicons
                  name={item.inputType === 'voice' ? 'mic' : 'text-outline'}
                  size={12}
                  color="rgba(255,255,255,0.7)"
                />
              )}
            </View>
          </LinearGradient>
        </Animatable.View>
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
        {item.tools && item.tools.length > 0 && (
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
        {messages.length === 0 && !uploading && !recording && !streaming ? (
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
              {recording ? (
                <View style={styles.embeddedRecordingView}>
                  <Waveform />
                  <Text style={styles.recordingText}>Recording...</Text>
                </View>
              ) : (
                <TextInput
                  style={styles.textInput}
                  placeholder="Message..."
                  placeholderTextColor="#999"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />
              )}
            </View>

            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                onPress={sendText}
                activeOpacity={0.8}
                style={styles.micButton}
                disabled={uploading || streaming}
              >
                <Ionicons name="send" size={24} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPressIn={uploading || streaming ? undefined : startRecording}
                onPressOut={uploading || streaming ? undefined : stopRecording}
                onPress={uploading || streaming ? stopGeneration : undefined}
                activeOpacity={0.8}
                style={[styles.micButton, recording && styles.micButtonActive]}
                // disabled={uploading || streaming} // Removed disabled to allow stop action
              >
                {uploading || streaming ? (
                  <Ionicons name="square" size={24} color="white" />
                ) : (
                  <Ionicons name="mic" size={24} color="white" />
                )}
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
    minWidth: 80,
    flexShrink: 1, // Allow shrinking to force wrap
  },
  userMessageText: {
    color: COLORS.white,
    fontFamily: Fonts.Sen_Regular,
    fontSize: 15,
    marginBottom: 4,
  },
  messageMetadata: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
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
  embeddedRecordingView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  recordingText: {
    marginLeft: 10,
    color: COLORS.primary,
    fontFamily: Fonts.Sen_Medium,
    fontSize: 16,
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
  micButtonActive: {
    transform: [{ scale: 1.1 }],
    backgroundColor: 'red',
  },
});
