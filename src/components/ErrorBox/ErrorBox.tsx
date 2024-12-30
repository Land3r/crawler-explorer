import { useState } from "react";
import { BiInfoCircleExtended, BiXExtended } from "../Icons/Icons";

interface ErrorBoxProps {
  title: string
  message: string
  onClose?: () => void
}

function ErrorBox({ title, message, onClose }: ErrorBoxProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  return (
    <div className='w-4/5 mx-auto border-2 rounded-lg pt-4 p-8 mt-2 relative bg-red-200'>
        
        <h5 className="text-red-500"><BiInfoCircleExtended className='inline'/> {title}</h5>
      <div className="flex flex-row">
        <button
        type="button"
        className="absolute top-4 right-4"
        onClick={handleClose}
        aria-label="Close error message"
      >
        <BiXExtended />
      </button>
      </div>
      <p>{message}</p>
    </div>
  )
}

export default ErrorBox;