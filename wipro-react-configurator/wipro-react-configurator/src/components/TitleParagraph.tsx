import React from 'react'
import '@/assets/styles/components/TitleParagraph.css'

interface Props {
    text: string;
}

const TitleParagraph = ({text}: Props) => {
  return (
    <h2 className='h2Text'>{text}</h2>
  )
}

export default TitleParagraph