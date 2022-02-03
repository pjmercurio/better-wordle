function Tile({letter, backgroundColor, color}) {
    const border = (backgroundColor === 'clear' || backgroundColor === undefined) ? '2px solid gray' : 'none';
    return (
        <div className="Tile" style={{backgroundColor, color, border}}>
            {letter?.toUpperCase()}
        </div>
    )
}