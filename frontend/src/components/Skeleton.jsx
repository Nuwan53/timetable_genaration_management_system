export default function Skeleton({ columns = 1, rows = 5 }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="skeleton-row">
          {[...Array(columns)].map((_, j) => {
            const isLast = j === columns - 1;
            const isFirst = j === 0;
            return (
              <td key={j}>
                <div 
                  className={`skeleton-box ${isLast ? 'skeleton-btn' : isFirst ? 'skeleton-title' : 'skeleton-text'}`} 
                  style={{ 
                    margin: isLast ? '0 auto' : undefined,
                    width: isLast ? '80px' : isFirst ? '60%' : '80%'
                  }}
                ></div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
