"use client";

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useParams } from "next/navigation";
// import { useMeeting } from "context/MeetingContext";
// import { useGlobalContext } from "context/GlobalContext";
// import { IWaitingRoomChat } from "@shared/interface/WaitingRoomChatInterface";
// import { IObserver, IObserverWaitingUser, IParticipant, IWaitingUser } from "@shared/interface/LiveSessionInterface";

// interface JoinAck {
// participantsWaitingRoom: IWaitingUser[];
//   observersWaitingRoom: IObserverWaitingUser[];
//   participantList: IParticipant[];
//   observerList: IObserver[];
// }

export default function Meeting() {
  // const { id: sessionId } = useParams();
  // const { user } = useGlobalContext();
  // const { socket } = useMeeting();

  // const hasJoined = useRef(false);

    // derive “me” either from AuthContext (moderator) or localStorage (participant)
  // const me = user
  //   ? { name: user.firstName, email: user.email, role: user.role as IParticipant["role"] }
  //   : JSON.parse(localStorage.getItem("liveSessionUser")!) as IWaitingUser;
  // memoize “me” so it doesn’t change each render
  // const me = useMemo(() => {
  //   if (user) {
  //     return {
  //       name: user.firstName,
  //       email: user.email,
  //       role: user.role as IParticipant["role"],
  //     };
  //   }
  //   const raw = localStorage.getItem("liveSessionUser");
  //   if (!raw) throw new Error("Missing liveSessionUser in localStorage");
  //   return JSON.parse(raw) as IWaitingUser;
  // }, [user]);

  // const [waiting, setWaiting] = useState<IWaitingUser[]>([]);
  // const [participants, setParticipants] = useState<IParticipant[]>([]);


  // const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  // const [messages, setMessages] = useState<IWaitingRoomChat[]>([]);
  // const [chatInput, setChatInput] = useState("");

  // useEffect(() => {
  //   if (!socket || hasJoined.current) return;

  //   hasJoined.current = true;

  //   socket.emit(
  //     "join-room",
  //     { sessionId, ...me },
  //   (rooms: JoinAck) => {
  //         // waiting room (exclude yourself)
  //       setWaiting(rooms.participantsWaitingRoom.filter((u) => u.email !== me.email));
  //       // active participants
  //       setParticipants(rooms.participantList);
  //     }
  //   );
  // }, [sessionId, socket, me]);

  // useEffect(() => {
  //   if (!socket ) return;

  //   // log and update waiting list
  //   socket.on("participantWaitingRoomUpdate", (list: IWaitingUser[]) => {
  //     setWaiting(list.filter((u) => u.email !== me.email));
  //   });

  //    socket.on("participantListUpdate", (list: IParticipant[]) => {
  //     setParticipants(list);
  //   });

  //   // receive all waiting-room chat
  //   socket.on(
  //     "participant-waiting-room:receive-message",
  //     (msg: IWaitingRoomChat & { timestamp: string }) => {
  //       const withDate: IWaitingRoomChat = {
  //         ...msg,
  //         timestamp: new Date(msg.timestamp),
  //       };
  //       setMessages((prev) => [...prev, withDate]);
  //     }
  //   );

  //   return () => {
  //     socket.off("participantWaitingRoomUpdate");
  //     socket.off("participantListUpdate");
  //     socket.off("participant-waiting-room:receive-message");
  //   };
  // }, [sessionId, socket, me]);

  // if(!user){
  //   return(
  //     <div className="p-4 text-center text-gray-500">Loading...</div>
  //   )
  // }

  // const sendMessage = () => {
  //   if (!selectedEmail || !chatInput.trim()) return;

  //   socket?.emit("participant-waiting-room:send-message", {
  //     sessionId,
  //     email: selectedEmail,
  //     senderName: user?.firstName,
  //     role: "Moderator" as const,
  //     content: chatInput.trim(),
  //   });

  //   setChatInput("");
  // };

  // const accept = (email: string) => {
  //   console.log('email', email)
  //   if (!socket) return;
  //   console.log('email', email)

  //   socket.emit(
  //     "acceptFromWaitingRoom",
  //     { sessionId, email },
  //     (res: {
  //       success: boolean;
  //       participantsWaitingRoom: IWaitingUser[];
  //       observersWaitingRoom: IObserverWaitingUser[];
  //       participantList: IParticipant[];
  //       observerList: IObserver[];
  //     }) => {
  //       if (res.success) {
  //         setWaiting(res.participantsWaitingRoom);
  //         setParticipants(res.participantList);
  //       }
  //     }
  //   );
  // };

  // const remove = (email: string) => {
  //   socket?.emit(
  //     "removeFromWaitingRoom",
  //     { sessionId, email },
  //     (res: { success: boolean; waitingRoom?: IWaitingUser[] }) => {
  //       const { success, waitingRoom } = res;
  //       if (success && waitingRoom) {
  //         setWaiting(waitingRoom);
  //       }
  //     }
  //   );
  // };

  // only show messages for the selected participant
  // const thread = messages
  //   .filter((m) => m.email === selectedEmail )
  //   .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="p-4 space-y-8 lg:flex lg:space-x-8 lg:space-y-0">
      <div className="flex-1">
        <section>
          <h3 className="text-lg font-semibold mb-2">Waiting Room</h3>
          {/* {waiting.length === 0 ? (
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
                    // onClick={() => accept(u.email)}
                  >
                    Accept
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded"
                    // onClick={() => remove(u.email)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )} */}
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">
            In-Meeting Participants
          </h3>
          {/* {participants?.length === 0 ? (
            <p className="text-gray-500">No participants yet</p>
          ) : (
            participants?.map((u) => (
              <div key={u.email} className="py-1">
                {u.name} <em className="text-gray-500 text-sm">({u.email})</em>
              </div>
            ))
          )} */}
        </section>
      </div>
      {/* Chat Panel */}
      <div className="flex-1 border p-4 rounded flex flex-col">
        <h3 className="text-lg font-semibold mb-2">Chat</h3>

        {/* Participant selector */}
        <div className="mb-4 flex space-x-2 overflow-x-auto">
          {/* {waiting.map((u) => (
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
          ))} */}
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {/* {(!selectedEmail || thread.length === 0) && (
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
          ))} */}
        </div>

        {/* Input */}
        {/* <div className="flex space-x-2">
          <input
            className="flex-1 border rounded px-2"
            placeholder={
              selectedEmail ? "Type a message…" : "Select a participant above"
            }
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            // onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={!selectedEmail}
          />
          <button
            className="px-4 py-1 bg-green-600 text-white rounded"
            // onClick={sendMessage}
            disabled={!selectedEmail || !chatInput.trim()}
          >
            Send
          </button>
        </div> */}
      </div>
    </div>
  );
}
