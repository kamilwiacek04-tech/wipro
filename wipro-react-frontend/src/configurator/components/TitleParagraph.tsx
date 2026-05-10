interface Props {
    text: string;
}

const TitleParagraph = ({text}: Props) => {
  return (
    <h2 className="text-[var(--black)]">{text}</h2>
  )
}

export default TitleParagraph
