"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMeeting } from "context/MeetingContext";
import { useGlobalContext } from "context/GlobalContext";
import { IWaitingRoomChat } from "@shared/interface/WaitingRoomChatInterface";

interface UserInfo {
  name: string;
  email: string;
  joinedAt: string;
}

export default function Meeting() {
  const { id: sessionId } = useParams();
  const { user } = useGlobalContext();
  const { socket } = useMeeting();

  const hasJoined = useRef(false);

  const [waiting, setWaiting] = useState<UserInfo[]>([]);
  const [participants, setParticipants] = useState<UserInfo[]>([]);

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<IWaitingRoomChat[]>([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (!socket || !user || hasJoined.current) return;

    hasJoined.current = true;

    socket.emit(
      "join-room",
      {
        sessionId,
        name: user.firstName,
        email: user.email,
        role: "Moderator",
      },
      (rooms: { participants: UserInfo[] }) => {
        const withoutMe = rooms.participants.filter(
          (u) => u.email !== user.email
        );
        setWaiting(withoutMe);
      }
    );
  }, [sessionId, socket, user]);

  useEffect(() => {
    if (!socket || !user) return;

    // log and update waiting list
    socket.on("participantWaitingRoomUpdate", (list: UserInfo[]) => {
      setWaiting(list.filter((u) => u.email !== user.email));
    });

    socket.on("participantListUpdate", setParticipants);

    // receive all waiting-room chat
    socket.on(
      "participant-waiting-room:receive-message",
      (msg: IWaitingRoomChat & { timestamp: string }) => {
        console.log("[Meeting:Moderator] ← received:", msg);

        const withDate: IWaitingRoomChat = {
          ...msg,
          timestamp: new Date(msg.timestamp),
        };
        setMessages((prev) => [...prev, withDate]);
      }
    );

    return () => {
      socket.off("participantWaitingRoomUpdate");
      socket.off("participantListUpdate");
      socket.off("participant-waiting-room:receive-message");
    };
  }, [sessionId, socket, user]);

  // if(!user){
  //   return(
  //     <div className="p-4 text-center text-gray-500">Loading...</div>
  //   )
  // }

  const sendMessage = () => {
    if (!selectedEmail || !chatInput.trim()) return;

    socket?.emit("participant-waiting-room:send-message", {
      sessionId,
      email: selectedEmail,
      senderName: user?.firstName,
      role: "Moderator" as const,
      content: chatInput.trim(),
    });

    setChatInput("");
  };

  const accept = (email: string) => {
    if (!socket) return;

    socket.emit(
      "acceptFromWaitingRoom",
      { sessionId, email },
      (res: {
        success: boolean;
        waitingRoom: UserInfo[];
        participantList: UserInfo[];
      }) => {
        if (res.success) {
          setWaiting(res.waitingRoom);
          setParticipants(res.participantList);
        }
      }
    );
  };

  const remove = (email: string) => {
    socket?.emit(
      "removeFromWaitingRoom",
      { sessionId, email },
      (res: { success: boolean; waitingRoom?: UserInfo[] }) => {
        const { success, waitingRoom } = res;
        if (success && waitingRoom) {
          setWaiting(waitingRoom);
        }
      }
    );
  };

  // only show messages for the selected participant
  const thread = messages
    .filter((m) => m.email === selectedEmail )
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="p-4 space-y-8 lg:flex lg:space-x-8 lg:space-y-0">
      <div className="flex-1">
        <section>
          <h3 className="text-lg font-semibold mb-2">Waiting Room</h3>
          {waiting.length === 0 ? (
            <p className="text-gray-500">No one waiting</p>
          ) : (
            waiting.map((u) => (
              <div
                key={`${u.email}-${u.joinedAt}`}
                className="flex justify-between items-center border-b py-2"
              >
                <span>
                  {u.name}{" "}
                  <em className="text-gray-500 text-sm">({u.email})</em>
                </span>
                <div className="space-x-2">
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                    onClick={() => accept(u.email)}
                  >
                    Accept
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded"
                    onClick={() => remove(u.email)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">
            In-Meeting Participants
          </h3>
          {participants.length === 0 ? (
            <p className="text-gray-500">No participants yet</p>
          ) : (
            participants.map((u) => (
              <div key={u.email} className="py-1">
                {u.name} <em className="text-gray-500 text-sm">({u.email})</em>
              </div>
            ))
          )}
        </section>
      </div>
      {/* Chat Panel */}
      <div className="flex-1 border p-4 rounded flex flex-col">
        <h3 className="text-lg font-semibold mb-2">Chat</h3>

        {/* Participant selector */}
        <div className="mb-4 flex space-x-2 overflow-x-auto">
          {waiting.map((u) => (
            <button
              key={u.email}
              className={`px-3 py-1 rounded ${
                u.email === selectedEmail
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => {
                setSelectedEmail(u.email);
                // setMessages([]); // or fetch history from API if you persist
              }}
            >
              {u.name}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {(!selectedEmail || thread.length === 0) && (
            <p className="text-gray-500">
              {selectedEmail
                ? "No messages yet."
                : "Select a participant to chat with."}
            </p>
          )}
          {thread.map((m) => (
            <div
              key={m.timestamp.toISOString()}
              className={`flex ${
                m.role === "Moderator" ? "justify-end" : "justify-start"
              }`}
            >
              <span
                className={`px-3 py-1 rounded ${
                  m.role === "Moderator"
                    ? "bg-blue-200 text-blue-800"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {m.content}
              </span>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <input
            className="flex-1 border rounded px-2"
            placeholder={
              selectedEmail ? "Type a message…" : "Select a participant above"
            }
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={!selectedEmail}
          />
          <button
            className="px-4 py-1 bg-green-600 text-white rounded"
            onClick={sendMessage}
            disabled={!selectedEmail || !chatInput.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
