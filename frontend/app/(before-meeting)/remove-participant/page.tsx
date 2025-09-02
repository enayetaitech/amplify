import React from 'react'

const RemoveParticipant = () => {
  return (
    <div className="max-w-md mx-auto p-6 text-center">
    <h2 className="text-2xl font-semibold mb-4">You’ve been removed</h2>
    <p className="text-sm text-muted-foreground mb-6">
        The moderator removed you from the session. If this was a mistake, you can try joining again using your project link.
      </p>
  </div>
  )
}

export default RemoveParticipant