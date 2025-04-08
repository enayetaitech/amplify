"use client"
import { useGlobalContext } from 'context/GlobalContext'
import React from 'react'

const CreateProject = () => {
  const {user}= useGlobalContext()

  console.log(user)
  return (
    <div>CreateProject</div>
  )
}

export default CreateProject