import { useState, useRef } from 'react'

interface FileUploadProps {
  onFileUpload: (data: any) => void
  onError: (message: string) => void
}

export default function FileUpload({ onFileUpload, onError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string)
        onFileUpload(jsonData)
      } catch (error) {
        console.log('Error while reading file', error)
        onError('Invalid JSON file. Please upload a valid JSON file.')
      }
    }
    reader.onerror = () => {
      onError('Error reading file. Please try again.')
    }
    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/json') {
      handleFile(file)
    } else {
      onError('Please upload a JSON file.')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={`w-4/5 mx-auto border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mt-[15%] py-44 ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="application/json"
        className="hidden"
        aria-label="Upload JSON file"
        />
      <svg className="h-8 w-8 inline text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
      <p className="text-lg mb-2">Drag and drop your JSON file here</p>
      <p className="text-sm text-gray-500">or click to select a file</p>
    </div>
  )
}