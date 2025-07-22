---" C:\work\amplify-new\frontend\package.json "---

{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build:shared": "tsc --build ../shared",
    "dev": "next dev",
    "build": "npm run build:shared && next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.0.1",
    "@radix-ui/react-accordion": "^1.2.10",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.2.4",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@stripe/react-stripe-js": "^3.6.0",
    "@stripe/stripe-js": "^7.0.0",
    "@tanstack/react-query": "^5.71.10",
    "axios": "^1.8.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.487.0",
    "next": "15.2.4",
    "next-themes": "^0.4.6",
    "react": "^19.0.0",
    "react-day-picker": "^8.10.1",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.5.0",
    "socket.io-client": "^4.8.1",
    "sonner": "^2.0.3",
    "tailwind-merge": "^3.1.0",
    "tw-animate-css": "^1.2.5",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4.1.3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.4.21",
    "eslint": "^9",
    "eslint-config-next": "15.2.4",
    "postcss": "^8.5.3",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}


---" C:\work\amplify-new\frontend\tailwind.config.ts "---

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'custom-meet-bg': '#fde2d0',
        'custom-gray-1': '#E8E8E8',
        'custom-white': '#FFFFFF',
        'custom-gray-2': '#F7F8F9',
        'custom-black': '#000000',
        'custom-orange-1': '#FF6600',
        'custom-dark-blue-1': '#00293C',
        'custom-dark-blue-2': '#031F3A',
        'custom-light-blue-1': '#2976a5',
        'custom-pink': '#FF7E296E',
        'custom-light-blue-2': '#369CFF',
        'custom-light-blue-3': '#559FFB',
        'custom-red': '#FF3838',
        'custom-green': '#07C800',
        'custom-gray-3': '#707070',
        'custom-orange-2': '#FC6E15',
        'custom-gray-4': '#00000029',
        'custom-teal': '#1E656D',
        'custom-yellow': '#FCD860',
        'custom-orange-3': '#E39906',
        'custom-gray-5': '#A8A8A8',
        'custom-gray-6': '#AFAFAF',
        'custom-gray-7': '#EAEAEA',
        'custom-gray-8': '#EBEBEB',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      backgroundImage: {
        'sidebar-gradient':
          'linear-gradient(28deg, #FC6E15 0%, #031f3a 100%) 0% 0% no-repeat',
      },
    },
  },
  plugins: [],
}


---" C:\work\amplify-new\frontend\tsconfig.json "---

{
  "compilerOptions": {
    "composite": true,
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"],
  "references": [
    { "path": "../shared" }  
  ]
}


---" C:\work\amplify-new\frontend\app\favicon.ico "---

(binary)


---" C:\work\amplify-new\frontend\app\globals.css "---

@tailwind base;
@tailwind components;
@tailwind utilities;

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}


---" C:\work\amplify-new\frontend\app\layout.tsx "---

import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'sonner'
import { GlobalProvider } from '@/context/GlobalContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NextTopLoader from 'nextjs-toploader'

const montserrat = Montserrat({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Amplify',
  description: 'Amplify',
}

const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <QueryClientProvider client={queryClient}>
          <GlobalProvider>
            <AuthProvider>
              <NextTopLoader color="#FC6E15" showSpinner={false} />
              {children}
              <Toaster richColors />
            </AuthProvider>
          </GlobalProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}


---" C:\work\amplify-new\frontend\app\page.tsx "---

import LoginPage from '@/components/login/LoginPage'

export default function Home() {
  return (
    <main>
      <LoginPage />
    </main>
  )
}


---" C:\work\amplify-new\frontend\components\AccountActivationUI.tsx "---

'use client'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from './ui/button'
import { activateAccount } from '@/lib/auth'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import BackToLogin from './BackToLogin'

const AccountActivationUI = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState('Activating your account...')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const activationToken = searchParams.get('token')
    if (activationToken) {
      activateAccount(activationToken)
        .then((res) => {
          setMessage(res.data.message)
          setIsSuccess(true)
          toast.success(res.data.message)
        })
        .catch((err) => {
          setMessage(err.response.data.message)
          setIsSuccess(false)
          toast.error(err.response.data.message)
        })
    } else {
      setMessage('Invalid activation link.')
      toast.error('Invalid activation link.')
    }
  }, [searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-10 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">{message}</h1>
        {isSuccess && (
          <Button onClick={() => router.push('/')}>Go to Login</Button>
        )}
        {!isSuccess && message !== 'Activating your account...' && (
          <BackToLogin />
        )}
      </div>
    </div>
  )
}

export default AccountActivationUI


---" C:\work\amplify-new\frontend\components\AddMeetingModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { Session, SessionType } from '@shared/interface/session'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { createSession } from '@/lib/session'
import { Project } from '@shared/interface/project'

const AddMeetingModal = ({ project }: { project: Project }) => {
  const [open, setOpen] = useState(false)
  const { refetchSessions } = useGlobalContext()

  const formSchema = z.object({
    sessionName: z.string().min(1, { message: 'Session name is required' }),
    sessionType: z.nativeEnum(SessionType),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessionName: '',
      sessionType: SessionType.TRADITIONAL,
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data: Partial<Session> = {
      ...values,
      project: project._id,
    }

    toast.promise(createSession(data), {
      loading: 'Creating session...',
      success: (res) => {
        setOpen(false)
        refetchSessions()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          Add Meeting
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Meeting</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sessionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Session Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sessionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a session type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(SessionType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddMeetingModal


---" C:\work\amplify-new\frontend\components\AddPollModal.tsx "---

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import MultipleChoicePollModal from './MultipleChoicePollModal'
import ShortAnswerPollModal from './ShortAnswerPollModal'
import LongAnswerPollModal from './LongAnswerPollModal'
import MatchingPollModal from './MatchingPollModal'
import FillBlankModal from './FillBlankModal'
import RankOrderPollModal from './RankOrderPollModal'
import RatingScaleModal from './RatingScaleModal'
import AddSingleChoicePollModal from './AddSingleChoicePollModal'

const AddPollModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          <Plus className="mr-2" />
          Add Poll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Poll</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-4">
          <AddSingleChoicePollModal />
          <MultipleChoicePollModal />
          <ShortAnswerPollModal />
          <LongAnswerPollModal />
          <MatchingPollModal />
          <FillBlankModal />
          <RankOrderPollModal />
          <RatingScaleModal />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddPollModal


---" C:\work\amplify-new\frontend\components\AddRepositoryModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { Project } from '@shared/interface/project'
import { createRepository } from '@/lib/project'

const AddRepositoryModal = ({ project }: { project: Project }) => {
  const [open, setOpen] = useState(false)
  const { refetchProject } = useGlobalContext()

  const formSchema = z.object({
    name: z.string().min(1, { message: 'Repository name is required' }),
    url: z.string().url({ message: 'Invalid URL' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      url: '',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast.promise(createRepository(project._id, values), {
      loading: 'Creating repository...',
      success: (res) => {
        setOpen(false)
        refetchProject()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          Add Repository
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Repository</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Repository Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Repository URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddRepositoryModal


---" C:\work\amplify-new\frontend\components\AddSingleChoicePollModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { useParams } from 'next/navigation'
import { createPoll } from '@/lib/poll'
import { PollType } from '@shared/interface/poll'

const AddSingleChoicePollModal = () => {
  const [open, setOpen] = useState(false)
  const { refetchPolls } = useGlobalContext()
  const params = useParams()
  const sessionId = params.sessionId as string

  const formSchema = z.object({
    question: z.string().min(1, { message: 'Question is required' }),
    options: z
      .array(z.string().min(1, { message: 'Option is required' }))
      .min(2, { message: 'At least two options are required' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      options: ['', ''],
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      ...values,
      type: PollType.SINGLE_CHOICE,
      session: sessionId,
    }

    toast.promise(createPoll(data), {
      loading: 'Creating poll...',
      success: (res) => {
        setOpen(false)
        refetchPolls()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  const addOption = () => {
    form.setValue('options', [...form.getValues('options'), ''])
  }

  const removeOption = (index: number) => {
    form.setValue(
      'options',
      form.getValues('options').filter((_, i) => i !== index)
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-24 flex items-center justify-center"
        >
          Single Choice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Single Choice Poll</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues('options').map((_, index) => (
              <FormField
                key={index}
                control={form.control}
                name={`options.${index}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option {index + 1}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder={`Option ${index + 1}`} {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeOption(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button type="button" onClick={addOption}>
              Add Option
            </Button>

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddSingleChoicePollModal


---" C:\work\amplify-new\frontend\components\AssignTagModal.tsx "---

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { Project } from '@shared/interface/project'
import { Checkbox } from './ui/checkbox'
import { Tag } from '@shared/interface/tag'
import { assignTagToProject, getTags } from '@/lib/tag'

const AssignTagModal = ({ project }: { project: Project }) => {
  const [open, setOpen] = useState(false)
  const { refetchProject } = useGlobalContext()
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    getTags().then((res) => {
      setTags(res)
    })
  }, [])

  const formSchema = z.object({
    tags: z.array(z.string()),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: project.tags.map((tag) => (tag as Tag)._id),
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast.promise(assignTagToProject(project._id, values.tags), {
      loading: 'Assigning tags...', 
      success: (res) => {
        setOpen(false)
        refetchProject()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          Assign Tag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Tag</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div key={tag._id} className="flex items-center gap-2">
                        <Checkbox
                          id={tag._id}
                          checked={field.value?.includes(tag._id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, tag._id])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== tag._id
                                  )
                                )
                          }}
                        />
                        <label htmlFor={tag._id}>{tag.name}</label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AssignTagModal


---" C:\work\amplify-new\frontend\components\BackToLogin.tsx "---

import { useRouter } from 'next/navigation'
import React from 'react'
import { Button } from './ui/button'

const BackToLogin = () => {
  const router = useRouter()
  return (
    <Button
      onClick={() => router.push('/')}
      className="text-custom-orange-1 underline"
      variant={'link'}
    >
      Back to Login
    </Button>
  )
}

export default BackToLogin


---" C:\work\amplify-new\frontend\components\ConfirmationModalComponent.tsx "---

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from './ui/button'

interface ConfirmationModalComponentProps {
  title: string
  description: string
  onConfirm: () => void
  trigger: React.ReactNode
}

const ConfirmationModalComponent = ({
  title,
  description,
  onConfirm,
  trigger,
}: ConfirmationModalComponentProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmationModalComponent


---" C:\work\amplify-new\frontend\components\CreateTag.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { createTag } from '@/lib/tag'

const CreateTag = () => {
  const [open, setOpen] = useState(false)
  const { refetchTags } = useGlobalContext()

  const formSchema = z.object({
    name: z.string().min(1, { message: 'Tag name is required' }),
    color: z.string().min(1, { message: 'Tag color is required' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '#000000',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast.promise(createTag(values), {
      loading: 'Creating tag...', 
      success: (res) => {
        setOpen(false)
        refetchTags()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          Create Tag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tag Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Color</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTag


---" C:\work\amplify-new\frontend\components\DashboardSidebarComponent.tsx "---

'use client'
import React from 'react'
import LogoComponent from './LogoComponent'
import { Button } from './ui/button'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { logout } from '@/lib/auth'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { User } from '@shared/interface/user'
import { getInitials } from '@/utils/getInitials'
import LogoutModalComponent from './LogoutModalComponent'

const DashboardSidebarComponent = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { removeToken, user } = useAuth()

  const handleLogout = () => {
    toast.promise(logout(), {
      loading: 'Logging out...', 
      success: (res) => {
        removeToken()
        router.push('/')
        return res.data.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  const menuItems = [
    {
      name: 'Projects',
      path: '/dashboard/projects',
    },
    {
      name: 'Tags',
      path: '/dashboard/tags',
    },
    {
      name: 'Users',
      path: '/dashboard/users',
    },
    {
      name: 'Profile',
      path: '/dashboard/profile',
    },
  ]

  return (
    <div className="h-screen w-64 bg-sidebar-gradient text-white flex flex-col fixed">
      <div className="p-4">
        <LogoComponent />
      </div>
      <nav className="flex-1 p-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Button
                variant={pathname.includes(item.path) ? 'secondary' : 'ghost'}
                onClick={() => router.push(item.path)}
                className="w-full justify-start"
              >
                {item.name}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={(user as User)?.profilePicture} />
            <AvatarFallback>{getInitials(user as User)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">{(user as User)?.name}</p>
            <p className="text-sm text-gray-400">{(user as User)?.email}</p>
          </div>
        </div>
        <LogoutModalComponent onConfirm={handleLogout}>
          <Button variant="destructive" className="w-full mt-4">
            Logout
          </Button>
        </LogoutModalComponent>
      </div>
    </div>
  )
}

export default DashboardSidebarComponent


---" C:\work\amplify-new\frontend\components\DatePicker.tsx "---

'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
}

export function DatePicker({ date, setDate }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}


---" C:\work\amplify-new\frontend\components\EditProjectModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { Project } from '@shared/interface/project'
import { updateProject } from '@/lib/project'
import { DatePicker } from './DatePicker'

const EditProjectModal = ({ project }: { project: Project }) => {
  const [open, setOpen] = useState(false)
  const { refetchProjects } = useGlobalContext()

  const formSchema = z.object({
    projectName: z.string().min(1, { message: 'Project name is required' }),
    clientName: z.string().min(1, { message: 'Client name is required' }),
    projectUsers: z
      .string()
      .min(1, { message: 'Project users are required' }),
    startDate: z.date(),
    endDate: z.date(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: project.projectName,
      clientName: project.clientName,
      projectUsers: project.projectUsers,
      startDate: new Date(project.startDate),
      endDate: new Date(project.endDate),
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast.promise(updateProject(project._id, values), {
      loading: 'Updating project...', 
      success: (res) => {
        setOpen(false)
        refetchProjects()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          Edit Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Client Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Users</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Users" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditProjectModal


---" C:\work\amplify-new\frontend\components\FillBlankModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { useParams } from 'next/navigation'
import { createPoll } from '@/lib/poll'
import { PollType } from '@shared/interface/poll'

const FillBlankModal = () => {
  const [open, setOpen] = useState(false)
  const { refetchPolls } = useGlobalContext()
  const params = useParams()
  const sessionId = params.sessionId as string

  const formSchema = z.object({
    question: z.string().min(1, { message: 'Question is required' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      ...values,
      type: PollType.FILL_IN_THE_BLANK,
      session: sessionId,
    }

    toast.promise(createPoll(data), {
      loading: 'Creating poll...', 
      success: (res) => {
        setOpen(false)
        refetchPolls()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-24 flex items-center justify-center"
        >
          Fill in the Blank
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Fill in the Blank Poll</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default FillBlankModal


---" C:\work\amplify-new\frontend\components\FooterComponent.tsx "---

import React from 'react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'

const FooterComponent = () => {
  const router = useRouter()
  return (
    <footer className="bg-custom-dark-blue-2 text-white p-4 text-center">
      <div className="flex justify-center gap-4">
        <Button
          variant="link"
          className="text-white"
          onClick={() => router.push('/terms-of-condition')}
        >
          Terms of Service
        </Button>
        <Button
          variant="link"
          className="text-white"
          onClick={() => router.push('/privacy-policy')}
        >
          Privacy Policy
        </Button>
      </div>
    </footer>
  )
}

export default FooterComponent


---" C:\work\amplify-new\frontend\components\Heading20pxBlueUCComponent.tsx "---

import React from 'react'

const Heading20pxBlueUCComponent = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <h1 className="text-xl text-custom-light-blue-1 uppercase">{children}</h1>
  )
}

export default Heading20pxBlueUCComponent


---" C:\work\amplify-new\frontend\components\HeadingBlue25pxComponent.tsx "---

import React from 'react'

const HeadingBlue25pxComponent = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return <h1 className="text-2xl text-custom-light-blue-1">{children}</h1>
}

export default HeadingBlue25pxComponent


---" C:\work\amplify-new\frontend\components\HeadingParagraphComponent.tsx "---

import React from 'react'

const HeadingParagraphComponent = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return <p className="text-custom-gray-3">{children}</p>
}

export default HeadingParagraphComponent


---" C:\work\amplify-new\frontend\components\InputFieldComponent.tsx "---

import React from 'react'
import { Input } from './ui/input'

interface InputFieldComponentProps {
  placeholder: string
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const InputFieldComponent = ({
  placeholder,
  type,
  value,
  onChange,
}: InputFieldComponentProps) => {
  return (
    <Input
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={onChange}
      className="w-full"
    />
  )
}

export default InputFieldComponent


---" C:\work\amplify-new\frontend\components\LogoComponent.tsx "---

import Image from 'next/image'
import React from 'react'

const LogoComponent = () => {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo.png" alt="Amplify" width={50} height={50} />
      <h1 className="text-2xl font-bold">Amplify</h1>
    </div>
  )
}

export default LogoComponent


---" C:\work\amplify-new\frontend\components\LogoutModalComponent.tsx "---

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface LogoutModalComponentProps {
  onConfirm: () => void
  children: React.ReactNode
}

const LogoutModalComponent = ({
  onConfirm,
  children,
}: LogoutModalComponentProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will log you out of your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Logout</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default LogoutModalComponent


---" C:\work\amplify-new\frontend\components\LongAnswerPollModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { useParams } from 'next/navigation'
import { createPoll } from '@/lib/poll'
import { PollType } from '@shared/interface/poll'

const LongAnswerPollModal = () => {
  const [open, setOpen] = useState(false)
  const { refetchPolls } = useGlobalContext()
  const params = useParams()
  const sessionId = params.sessionId as string

  const formSchema = z.object({
    question: z.string().min(1, { message: 'Question is required' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      ...values,
      type: PollType.LONG_ANSWER,
      session: sessionId,
    }

    toast.promise(createPoll(data), {
      loading: 'Creating poll...', 
      success: (res) => {
        setOpen(false)
        refetchPolls()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-24 flex items-center justify-center"
        >
          Long Answer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Long Answer Poll</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default LongAnswerPollModal


---" C:\work\amplify-new\frontend\components\MatchingPollModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { useParams } from 'next/navigation'
import { createPoll } from '@/lib/poll'
import { PollType } from '@shared/interface/poll'

const MatchingPollModal = () => {
  const [open, setOpen] = useState(false)
  const { refetchPolls } = useGlobalContext()
  const params = useParams()
  const sessionId = params.sessionId as string

  const formSchema = z.object({
    question: z.string().min(1, { message: 'Question is required' }),
    options: z
      .array(
        z.object({
          left: z.string().min(1, { message: 'Left option is required' }),
          right: z.string().min(1, { message: 'Right option is required' }),
        })
      )
      .min(2, { message: 'At least two options are required' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      options: [
        { left: '', right: '' },
        { left: '', right: '' },
      ],
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      ...values,
      type: PollType.MATCHING,
      session: sessionId,
    }

    toast.promise(createPoll(data), {
      loading: 'Creating poll...', 
      success: (res) => {
        setOpen(false)
        refetchPolls()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  const addOption = () => {
    form.setValue('options', [
      ...form.getValues('options'),
      { left: '', right: '' },
    ])
  }

  const removeOption = (index: number) => {
    form.setValue(
      'options',
      form.getValues('options').filter((_, i) => i !== index)
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-24 flex items-center justify-center"
        >
          Matching
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Matching Poll</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues('options').map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`options.${index}.left`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Left Option {index + 1}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`Left Option ${index + 1}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`options.${index}.right`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Right Option {index + 1}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`Right Option ${index + 1}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeOption(index)}
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button type="button" onClick={addOption}>
              Add Option
            </Button>

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default MatchingPollModal


---" C:\work\amplify-new\frontend\components\MemberBulkUpdate.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { Project } from '@shared/interface/project'
import { Textarea } from './ui/textarea'
import { bulkUpdateMembers } from '@/lib/project'

const MemberBulkUpdate = ({ project }: { project: Project }) => {
  const [open, setOpen] = useState(false)
  const { refetchProject } = useGlobalContext()

  const formSchema = z.object({
    members: z.string().min(1, { message: 'Members are required' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      members: '',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const members = values.members
      .split('\n')
      .map((member) => {
        const [name, email] = member.split(',')
        return { name, email }
      })
      .filter((member) => member.name && member.email)

    toast.promise(bulkUpdateMembers(project._id, members), {
      loading: 'Updating members...', 
      success: (res) => {
        setOpen(false)
        refetchProject()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          Bulk Update
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Update Members</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Members</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter members in the format: name,email (one per line)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default MemberBulkUpdate


---" C:\work\amplify-new\frontend\components\MemberTabAddMember.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { Project } from '@shared/interface/project'
import { addMember } from '@/lib/project'

const MemberTabAddMember = ({ project }: { project: Project }) => {
  const [open, setOpen] = useState(false)
  const { refetchProject } = useGlobalContext()

  const formSchema = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z.string().email({ message: 'Invalid email' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast.promise(addMember(project._id, values), {
      loading: 'Adding member...', 
      success: (res) => {
        setOpen(false)
        refetchProject()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default MemberTabAddMember


---" C:\work\amplify-new\frontend\components\MultipleChoicePollModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { useParams } from 'next/navigation'
import { createPoll } from '@/lib/poll'
import { PollType } from '@shared/interface/poll'

const MultipleChoicePollModal = () => {
  const [open, setOpen] = useState(false)
  const { refetchPolls } = useGlobalContext()
  const params = useParams()
  const sessionId = params.sessionId as string

  const formSchema = z.object({
    question: z.string().min(1, { message: 'Question is required' }),
    options: z
      .array(z.string().min(1, { message: 'Option is required' }))
      .min(2, { message: 'At least two options are required' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      options: ['', ''],
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      ...values,
      type: PollType.MULTIPLE_CHOICE,
      session: sessionId,
    }

    toast.promise(createPoll(data), {
      loading: 'Creating poll...', 
      success: (res) => {
        setOpen(false)
        refetchPolls()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  const addOption = () => {
    form.setValue('options', [...form.getValues('options'), ''])
  }

  const removeOption = (index: number) => {
    form.setValue(
      'options',
      form.getValues('options').filter((_, i) => i !== index)
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-24 flex items-center justify-center"
        >
          Multiple Choice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Multiple Choice Poll</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues('options').map((_, index) => (
              <FormField
                key={index}
                control={form.control}
                name={`options.${index}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option {index + 1}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder={`Option ${index + 1}`} {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeOption(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button type="button" onClick={addOption}>
              Add Option
            </Button>

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default MultipleChoicePollModal


---" C:\work\amplify-new\frontend\components\NoSearchResult.tsx "---

import Image from 'next/image'
import React from 'react'

const NoSearchResult = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <Image
        src="/no-search-result.png"
        alt="No search result"
        width={200}
        height={200}
      />
      <p className="text-lg text-gray-500">No search result</p>
    </div>
  )
}

export default NoSearchResult


---" C:\work\amplify-new\frontend\components\PasswordModalComponent.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { changePassword } from '@/lib/user'

const PasswordModalComponent = () => {
  const [open, setOpen] = useState(false)

  const formSchema = z
    .object({
      oldPassword: z.string().min(1, { message: 'Old password is required' }),
      newPassword: z.string().min(1, { message: 'New password is required' }),
      confirmPassword: z
        .string()
        .min(1, { message: 'Confirm password is required' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast.promise(changePassword(values), {
      loading: 'Changing password...', 
      success: (res) => {
        setOpen(false)
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Old Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Old Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="New Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default PasswordModalComponent


---" C:\work\amplify-new\frontend\components\ProjectFilter.tsx "---

import React, { useEffect, useState } from 'react'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Tag } from '@shared/interface/tag'
import { getTags } from '@/lib/tag'

interface ProjectFilterProps {
  search: string
  setSearch: (search: string) => void
  tag: string
  setTag: (tag: string) => void
}

const ProjectFilter = ({
  search,
  setSearch,
  tag,
  setTag,
}: ProjectFilterProps) => {
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    getTags().then((res) => {
      setTags(res)
    })
  }, [])

  return (
    <div className="flex gap-4">
      <Input
        placeholder="Search by project name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Select onValueChange={setTag} value={tag}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {tags.map((tag) => (
            <SelectItem key={tag._id} value={tag._id}>
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default ProjectFilter


---" C:\work\amplify-new\frontend\components\ProjectTable.tsx "---

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Project } from '@shared/interface/project'
import { Badge } from './ui/badge'
import { Tag } from '@shared/interface/tag'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'

interface ProjectTableProps {
  projects: Project[]
}

const ProjectTable = ({ projects }: ProjectTableProps) => {
  const router = useRouter()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project Name</TableHead>
          <TableHead>Client Name</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project._id}>
            <TableCell>{project.projectName}</TableCell>
            <TableCell>{project.clientName}</TableCell>
            <TableCell>{new Date(project.startDate).toDateString()}</TableCell>
            <TableCell>{new Date(project.endDate).toDateString()}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                {project.tags.map((tag) => (
                  <Badge key={(tag as Tag)._id}>{(tag as Tag).name}</Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <Button
                onClick={() =>
                  router.push(`/dashboard/projects/${project._id}`)
                }
              >
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default ProjectTable


---" C:\work\amplify-new\frontend\components\RankOrderPollModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { useParams } from 'next/navigation'
import { createPoll } from '@/lib/poll'
import { PollType } from '@shared/interface/poll'

const RankOrderPollModal = () => {
  const [open, setOpen] = useState(false)
  const { refetchPolls } = useGlobalContext()
  const params = useParams()
  const sessionId = params.sessionId as string

  const formSchema = z.object({
    question: z.string().min(1, { message: 'Question is required' }),
    options: z
      .array(z.string().min(1, { message: 'Option is required' }))
      .min(2, { message: 'At least two options are required' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      options: ['', ''],
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      ...values,
      type: PollType.RANK_ORDER,
      session: sessionId,
    }

    toast.promise(createPoll(data), {
      loading: 'Creating poll...', 
      success: (res) => {
        setOpen(false)
        refetchPolls()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  const addOption = () => {
    form.setValue('options', [...form.getValues('options'), ''])
  }

  const removeOption = (index: number) => {
    form.setValue(
      'options',
      form.getValues('options').filter((_, i) => i !== index)
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-24 flex items-center justify-center"
        >
          Rank Order
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Rank Order Poll</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues('options').map((_, index) => (
              <FormField
                key={index}
                control={form.control}
                name={`options.${index}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option {index + 1}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder={`Option ${index + 1}`} {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeOption(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button type="button" onClick={addOption}>
              Add Option
            </Button>

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default RankOrderPollModal


---" C:\work\amplify-new\frontend\components\RatingScaleModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { useParams } from 'next/navigation'
import { createPoll } from '@/lib/poll'
import { PollType } from '@shared/interface/poll'

const RatingScaleModal = () => {
  const [open, setOpen] = useState(false)
  const { refetchPolls } = useGlobalContext()
  const params = useParams()
  const sessionId = params.sessionId as string

  const formSchema = z.object({
    question: z.string().min(1, { message: 'Question is required' }),
    options: z
      .array(z.string().min(1, { message: 'Option is required' }))
      .min(2, { message: 'At least two options are required' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      options: ['', ''],
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      ...values,
      type: PollType.RATING_SCALE,
      session: sessionId,
    }

    toast.promise(createPoll(data), {
      loading: 'Creating poll...', 
      success: (res) => {
        setOpen(false)
        refetchPolls()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  const addOption = () => {
    form.setValue('options', [...form.getValues('options'), ''])
  }

  const removeOption = (index: number) => {
    form.setValue(
      'options',
      form.getValues('options').filter((_, i) => i !== index)
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-24 flex items-center justify-center"
        >
          Rating Scale
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Rating Scale Poll</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues('options').map((_, index) => (
              <FormField
                key={index}
                control={form.control}
                name={`options.${index}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option {index + 1}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder={`Option ${index + 1}`} {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeOption(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <Button type="button" onClick={addOption}>
              Add Option
            </Button>

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default RatingScaleModal


---" C:\work\amplify-new\frontend\components\Search.tsx "---

import React from 'react'
import { Input } from './ui/input'

interface SearchProps {
  search: string
  setSearch: (search: string) => void
  placeholder: string
}

const Search = ({
  search,
  setSearch,
  placeholder,
}: SearchProps) => {
  return (
    <Input
      placeholder={placeholder}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  )
}

export default Search


---" C:\work\amplify-new\frontend\components\ShareProjectModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { Project } from '@shared/interface/project'
import { shareProject } from '@/lib/project'
import { UserRole } from '@shared/interface/user'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const ShareProjectModal = ({ project }: { project: Project }) => {
  const [open, setOpen] = useState(false)

  const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email' }),
    role: z.nativeEnum(UserRole),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: UserRole.OBSERVER,
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast.promise(shareProject(project._id, values.email, values.role), {
      loading: 'Sharing project...', 
      success: (res) => {
        setOpen(false)
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          Share Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(UserRole)
                        .filter((role) => role !== UserRole.ADMIN)
                        .map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ShareProjectModal


---" C:\work\amplify-new\frontend\components\ShortAnswerPollModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { useParams } from 'next/navigation'
import { createPoll } from '@/lib/poll'
import { PollType } from '@shared/interface/poll'

const ShortAnswerPollModal = () => {
  const [open, setOpen] = useState(false)
  const { refetchPolls } = useGlobalContext()
  const params = useParams()
  const sessionId = params.sessionId as string

  const formSchema = z.object({
    question: z.string().min(1, { message: 'Question is required' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      ...values,
      type: PollType.SHORT_ANSWER,
      session: sessionId,
    }

    toast.promise(createPoll(data), {
      loading: 'Creating poll...', 
      success: (res) => {
        setOpen(false)
        refetchPolls()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-24 flex items-center justify-center"
        >
          Short Answer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Short Answer Poll</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="Question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ShortAnswerPollModal


---" C:\work\amplify-new\frontend\components\TabContent.tsx "---

import React from 'react'

interface TabContentProps {
  id: string
  activeTab: string
  children: React.ReactNode
}

const TabContent = ({
  id,
  activeTab,
  children,
}: TabContentProps) => {
  return activeTab === id ? <div>{children}</div> : null
}

export default TabContent


---" C:\work\amplify-new\frontend\components\TabNavigation.tsx "---

import React from 'react'

interface TabNavigationProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  setActiveTab: (id: string) => void
}

const TabNavigation = ({
  tabs,
  activeTab,
  setActiveTab,
}: TabNavigationProps) => {
  return (
    <div className="flex border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`py-2 px-4 ${
            activeTab === tab.id
              ? 'border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default TabNavigation


---" C:\work\amplify-new\frontend\components\UploadResultsModal.tsx "---

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { useGlobalContext } from '@/context/GlobalContext'
import { Project } from '@shared/interface/project'
import { uploadDeliverable } from '@/lib/project'

const UploadResultsModal = ({ project }: { project: Project }) => {
  const [open, setOpen] = useState(false)
  const { refetchProject } = useGlobalContext()

  const formSchema = z.object({
    name: z.string().min(1, { message: 'Deliverable name is required' }),
    file: z.instanceof(File),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('file', values.file)

    toast.promise(uploadDeliverable(project._id, formData), {
      loading: 'Uploading deliverable...', 
      success: (res) => {
        setOpen(false)
        refetchProject()
        return res.message
      },
      error: (err) => {
        return err.response.data.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-custom-orange-1 text-white hover:bg-custom-orange-2">
          Upload Results
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Results</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deliverable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Deliverable Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      onChange={(e) =>
                        field.onChange(e.target.files?.[0] || null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default UploadResultsModal


---" C:\work\amplify-new\frontend\components\ViewProject.tsx "---

'use client'
import { useGlobalContext } from '@/context/GlobalContext'
import { getProjectById } from '@/lib/project'
import { Project } from '@shared/interface/project'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import ViewProjectHeader from './viewProject/ViewProjectHeader'
import ViewProjectTabs from './viewProject/ViewProjectTabs'

const ViewProject = () => {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const { shouldRefetchProject, doneRefetchingProject } = useGlobalContext()

  useEffect(() => {
    if (projectId) {
      getProjectById(projectId)
        .then((res) => {
          setProject(res)
        })
        .catch((err) => {
          toast.error(err.response.data.message)
        })
    }
  }, [projectId])

  useEffect(() => {
    if (shouldRefetchProject) {
      getProjectById(projectId)
        .then((res) => {
          setProject(res)
          doneRefetchingProject()
        })
        .catch((err) => {
          toast.error(err.response.data.message)
        })
    }
  }, [shouldRefetchProject, doneRefetchingProject, projectId])

  if (!project) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <ViewProjectHeader project={project} />
      <ViewProjectTabs project={project} />
    </div>
  )
}

export default ViewProject


---" C:\work\amplify-new\frontend\constant\index.ts "---

export const API_URL = process.env.NEXT_PUBLIC_API_URL


---" C:\work\amplify-new\frontend\context\AuthContext.tsx "---

'use client'
import { API_URL } from '@/constant'
import { User } from '@shared/interface/user'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  token: string | null
  user: User | null
  setToken: (token: string | null) => void
  removeToken: () => void
  refetchUser: () => void
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  setToken: () => {},
  removeToken: () => {},
  refetchUser: () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios
        .get(`${API_URL}/user/me`)
        .then((res) => {
          setUser(res.data)
        })
        .catch(() => {
          removeToken()
          router.push('/')
        })
    } else {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token, router])

  const removeToken = () => {
    setToken(null)
  }

  const refetchUser = () => {
    if (token) {
      axios
        .get(`${API_URL}/user/me`)
        .then((res) => {
          setUser(res.data)
        })
        .catch(() => {
          removeToken()
          router.push('/')
        })
    }
  }

  return (
    <AuthContext.Provider
      value={{ token, setToken, removeToken, user, refetchUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)


---" C:\work\amplify-new\frontend\context\DashboardContext.tsx "---

'use client'
import React, { createContext, useContext, useState } from 'react'

interface DashboardContextType {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const DashboardContext = createContext<DashboardContextType>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
})

export const DashboardProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <DashboardContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => useContext(DashboardContext)


---" C:\work\amplify-new\frontend\context\GlobalContext.tsx "---

'use client'
import React, { createContext, useContext, useState } from 'react'

interface GlobalContextType {
  shouldRefetchProjects: boolean
  refetchProjects: () => void
  doneRefetchingProjects: () => void
  shouldRefetchProject: boolean
  refetchProject: () => void
  doneRefetchingProject: () => void
  shouldRefetchTags: boolean
  refetchTags: () => void
  doneRefetchingTags: () => void
  shouldRefetchUsers: boolean
  refetchUsers: () => void
  doneRefetchingUsers: () => void
  shouldRefetchSessions: boolean
  refetchSessions: () => void
  doneRefetchingSessions: () => void
  shouldRefetchPolls: boolean
  refetchPolls: () => void
  doneRefetchingPolls: () => void
}

const GlobalContext = createContext<GlobalContextType>({
  shouldRefetchProjects: false,
  refetchProjects: () => {},
  doneRefetchingProjects: () => {},
  shouldRefetchProject: false,
  refetchProject: () => {},
  doneRefetchingProject: () => {},
  shouldRefetchTags: false,
  refetchTags: () => {},
  doneRefetchingTags: () => {},
  shouldRefetchUsers: false,
  refetchUsers: () => {},
  doneRefetchingUsers: () => {},
  shouldRefetchSessions: false,
  refetchSessions: () => {},
  doneRefetchingSessions: () => {},
  shouldRefetchPolls: false,
  refetchPolls: () => {},
  doneRefetchingPolls: () => {},
})

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [shouldRefetchProjects, setShouldRefetchProjects] = useState(false)
  const [shouldRefetchProject, setShouldRefetchProject] = useState(false)
  const [shouldRefetchTags, setShouldRefetchTags] = useState(false)
  const [shouldRefetchUsers, setShouldRefetchUsers] = useState(false)
  const [shouldRefetchSessions, setShouldRefetchSessions] = useState(false)
  const [shouldRefetchPolls, setShouldRefetchPolls] = useState(false)

  const refetchProjects = () => setShouldRefetchProjects(true)
  const doneRefetchingProjects = () => setShouldRefetchProjects(false)

  const refetchProject = () => setShouldRefetchProject(true)
  const doneRefetchingProject = () => setShouldRefetchProject(false)

  const refetchTags = () => setShouldRefetchTags(true)
  const doneRefetchingTags = () => setShouldRefetchTags(false)

  const refetchUsers = () => setShouldRefetchUsers(true)
  const doneRefetchingUsers = () => setShouldRefetchUsers(false)

  const refetchSessions = () => setShouldRefetchSessions(true)
  const doneRefetchingSessions = () => setShouldRefetchSessions(false)

  const refetchPolls = () => setShouldRefetchPolls(true)
  const doneRefetchingPolls = () => setShouldRefetchPolls(false)

  return (
    <GlobalContext.Provider
      value={{
        shouldRefetchProjects,
        refetchProjects,
        doneRefetchingProjects,
        shouldRefetchProject,
        refetchProject,
        doneRefetchingProject,
        shouldRefetchTags,
        refetchTags,
        doneRefetchingTags,
        shouldRefetchUsers,
        refetchUsers,
        doneRefetchingUsers,
        shouldRefetchSessions,
        refetchSessions,
        doneRefetchingSessions,
        shouldRefetchPolls,
        refetchPolls,
        doneRefetchingPolls,
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}

export const useGlobalContext = () => useContext(GlobalContext)


---" C:\work\amplify-new\frontend\context\MeetingContext.tsx "---

'use client'
import { Session } from '@shared/interface/session'
import React, { createContext, useContext, useState } from 'react'

interface MeetingContextType {
  session: Session | null
  setSession: (session: Session | null) => void
}

const MeetingContext = createContext<MeetingContextType>({
  session: null,
  setSession: () => {},
})

export const MeetingProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)

  return (
    <MeetingContext.Provider value={{ session, setSession }}>
      {children}
    </MeetingContext.Provider>
  )
}

export const useMeeting = () => useContext(MeetingContext)


---" C:\work\amplify-new\frontend\hooks\use-mobile.ts "---

import { useMediaQuery } from 'usehooks-ts'

export function useMobile() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile
}


---" C:\work\amplify-new\frontend\hooks\useCountryList.ts "---

import { useState, useEffect } from 'react'

interface Country {
  name: string
  code: string
}

const useCountryList = () => {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all')
        if (!response.ok) {
          throw new Error('Failed to fetch countries')
        }
        const data = await response.json()
        const countryList = data.map((country: any) => ({
          name: country.name.common,
          code: country.cca2,
        }))
        countryList.sort((a: Country, b: Country) => a.name.localeCompare(b.name))
        setCountries(countryList)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  return { countries, loading, error }
}

export default useCountryList


---" C:\work\amplify-new\frontend\lib\auth.ts "---

import { API_URL } from '@/constant'
import {
  LoginCredentials,
  RegisterCredentials,
} from '@/schemas/auth.schema'
import axios from 'axios'

export const login = (credentials: LoginCredentials) => {
  return axios.post(`${API_URL}/user/login`, credentials)
}

export const register = (credentials: RegisterCredentials) => {
  return axios.post(`${API_URL}/user/register`, credentials)
}

export const logout = () => {
  return axios.post(`${API_URL}/user/logout`)
}

export const activateAccount = (token: string) => {
  return axios.get(`${API_URL}/user/activate-account?token=${token}`)
}

export const forgotPassword = (email: string) => {
  return axios.post(`${API_URL}/user/forgot-password`, { email })
}

export const resetPassword = (password: string, token: string) => {
  return axios.post(`${API_URL}/user/reset-password`, { password, token })
}


---" C:\work\amplify-new\frontend\lib\poll.ts "---

import { API_URL } from '@/constant'
import { Poll } from '@shared/interface/poll'
import axios from 'axios'

export const getPollsBySession = (sessionId: string): Promise<Poll[]> => {
  return axios.get(`${API_URL}/poll/session/${sessionId}`).then((res) => res.data)
}

export const createPoll = (data: Partial<Poll>) => {
  return axios.post(`${API_URL}/poll`, data).then((res) => res.data)
}

export const updatePoll = (id: string, data: Partial<Poll>) => {
  return axios.put(`${API_URL}/poll/${id}`, data).then((res) => res.data)
}

export const deletePoll = (id: string) => {
  return axios.delete(`${API_URL}/poll/${id}`).then((res) => res.data)
}


---" C:\work\amplify-new\frontend\lib\project.ts "---

import { API_URL } from '@/constant'
import { Project } from '@shared/interface/project'
import { UserRole } from '@shared/interface/user'
import axios from 'axios'

export const getProjects = (): Promise<Project[]> => {
  return axios.get(`${API_URL}/project`).then((res) => res.data)
}

export const getProjectById = (id: string): Promise<Project> => {
  return axios.get(`${API_URL}/project/${id}`).then((res) => res.data)
}

export const createProject = (data: Partial<Project>) => {
  return axios.post(`${API_URL}/project`, data).then((res) => res.data)
}

export const updateProject = (id: string, data: Partial<Project>) => {
  return axios.put(`${API_URL}/project/${id}`, data).then((res) => res.data)
}

export const deleteProject = (id: string) => {
  return axios.delete(`${API_URL}/project/${id}`).then((res) => res.data)
}

export const shareProject = (id: string, email: string, role: UserRole) => {
  return axios
    .post(`${API_URL}/project/${id}/share`, { email, role })
    .then((res) => res.data)
}

export const addMember = (
  id: string,
  member: { name: string; email: string }
) => {
  return axios
    .post(`${API_URL}/project/${id}/members`, member)
    .then((res) => res.data)
}

export const bulkUpdateMembers = (
  id: string,
  members: { name: string; email: string }[]
) => {
  return axios
    .post(`${API_URL}/project/${id}/members/bulk`, members)
    .then((res) => res.data)
}

export const removeMember = (id: string, memberId: string) => {
  return axios
    .delete(`${API_URL}/project/${id}/members/${memberId}`)
    .then((res) => res.data)
}

export const createRepository = (
  id: string,
  repository: { name: string; url: string }
) => {
  return axios
    .post(`${API_URL}/project/${id}/repositories`, repository)
    .then((res) => res.data)
}

export const removeRepository = (id: string, repositoryId: string) => {
  return axios
    .delete(`${API_URL}/project/${id}/repositories/${repositoryId}`)
    .then((res) => res.data)
}

export const uploadDeliverable = (id: string, data: FormData) => {
  return axios
    .post(`${API_URL}/project/${id}/deliverables`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => res.data)
}

export const removeDeliverable = (id: string, deliverableId: string) => {
  return axios
    .delete(`${API_URL}/project/${id}/deliverables/${deliverableId}`)
    .then((res) => res.data)
}


---" C:\work\amplify-new\frontend\lib\session.ts "---

import { API_URL } from '@/constant'
import { Session } from '@shared/interface/session'
import axios from 'axios'

export const getSessionsByProject = (projectId: string): Promise<Session[]> => {
  return axios
    .get(`${API_URL}/session/project/${projectId}`)
    .then((res) => res.data)
}

export const getSessionById = (id: string): Promise<Session> => {
  return axios.get(`${API_URL}/session/${id}`).then((res) => res.data)
}

export const createSession = (data: Partial<Session>) => {
  return axios.post(`${API_URL}/session`, data).then((res) => res.data)
}

export const updateSession = (id: string, data: Partial<Session>) => {
  return axios.put(`${API_URL}/session/${id}`, data).then((res) => res.data)
}

export const deleteSession = (id: string) => {
  return axios.delete(`${API_URL}/session/${id}`).then((res) => res.data)
}


---" C:\work\amplify-new\frontend\lib\tag.ts "---

import { API_URL } from '@/constant'
import { Tag } from '@shared/interface/tag'
import axios from 'axios'

export const getTags = (): Promise<Tag[]> => {
  return axios.get(`${API_URL}/tag`).then((res) => res.data)
}

export const createTag = (data: Partial<Tag>) => {
  return axios.post(`${API_URL}/tag`, data).then((res) => res.data)
}

export const updateTag = (id: string, data: Partial<Tag>) => {
  return axios.put(`${API_URL}/tag/${id}`, data).then((res) => res.data)
}

export const deleteTag = (id: string) => {
  return axios.delete(`${API_URL}/tag/${id}`).then((res) => res.data)
}

export const assignTagToProject = (projectId: string, tags: string[]) => {
  return axios
    .post(`${API_URL}/tag/assign`, { projectId, tags })
    .then((res) => res.data)
}


---" C:\work\amplify-new\frontend\lib\user.ts "---

import { API_URL } from '@/constant'
import { User } from '@shared/interface/user'
import axios from 'axios'

export const getUsers = (): Promise<User[]> => {
  return axios.get(`${API_URL}/user`).then((res) => res.data)
}

export const updateUser = (id: string, data: Partial<User>) => {
  return axios.put(`${API_URL}/user/${id}`, data).then((res) => res.data)
}

export const deleteUser = (id: string) => {
  return axios.delete(`${API_URL}/user/${id}`).then((res) => res.data)
}

export const changePassword = (data: any) => {
  return axios.post(`${API_URL}/user/change-password`, data).then((res) => res.data)
}


---" C:\work\amplify-new\frontend\lib\utils.ts "---

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


---" C:\work\amplify-new\frontend\provider\TanstackProvider.tsx "---

'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React, { useState } from 'react'

const TanstackProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default TanstackProvider


---" C:\work\amplify-new\frontend\schemas\auth.schema.ts "---

import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: 'Password is required' }),
})

export type LoginCredentials = z.infer<typeof LoginSchema>

export const RegisterSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  country: z.string().min(1, { message: 'Country is required' }),
})

export type RegisterCredentials = z.infer<typeof RegisterSchema>


---" C:\work\amplify-new\frontend\utils\getInitials.ts "---

import { User } from '@shared/interface/user'

export const getInitials = (user: User) => {
  if (!user) return ''
  const fullName = user.name.split(' ')
  const initials = fullName.shift()?.charAt(0) + fullName.pop()?.charAt(0)
  return initials.toUpperCase()
}

