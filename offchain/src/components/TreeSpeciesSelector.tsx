import React, { useState } from 'react';

type TreeSpeciesSelectorProps = {
  onSelect: (species: string) => void;
  initialSpecies?: string;
};

const TreeSpeciesSelector: React.FC<TreeSpeciesSelectorProps> = ({ onSelect, initialSpecies = 'oak' }) => {
  const [treeSpecies, setTreeSpecies] = useState(initialSpecies);

  const handleSelect = (species: string) => {
    setTreeSpecies(species);
    onSelect(species);
  };

  return (
    <details className="dropdown">
      <summary tabIndex={0} className="btn m-1">{treeSpecies}</summary>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
        {['oak', 'pine', 'maple', 'apple', 'ashe'].map(species => (
          <li key={species}>
            <a 
              onClick={() => handleSelect(species)}
              className={species === treeSpecies ? 'active' : ''}
            >              
              {species}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
};

export default TreeSpeciesSelector;