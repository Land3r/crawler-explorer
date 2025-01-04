import { FaGithubSquareExtended } from "../Icons/Icons"

interface GitHubCornerProps {
  repoUrl: string
}

const GitHubLink = ({ repoUrl }: GitHubCornerProps) => (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="bottom-2 absolute p-1 rounded-lg text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-gray-200 hover:scale-110"
      aria-label="View source on GitHub"
      >
      <FaGithubSquareExtended className="w-8 h-8" /> View on Github
    </a>
  )

export default GitHubLink