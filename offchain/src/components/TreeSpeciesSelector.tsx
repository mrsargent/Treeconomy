import React, { useState } from 'react';

type TreeSpeciesSelectorProps = {
  onSelect: (species: string) => void;
  initialSpecies?: string;
};

const TreeSpeciesSelector: React.FC<TreeSpeciesSelectorProps> = ({ onSelect, initialSpecies = 'oak' }) => {
  const [treeSpecies, setTreeSpecies] = useState(initialSpecies);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpecies = e.target.value;
    setTreeSpecies(newSpecies);
    onSelect(newSpecies);
  };

  return (
    <select 
      value={treeSpecies} 
      onChange={handleChange}
      className="ml-2 p-1 bg-white"
    >
      <option value="oak">Oak</option>
      <option value="pine">Pine</option>
      <option value="maple">Maple</option>
      <option value="apple">Apple</option>
      <option value="ashe">Ashe</option>
    </select>
  );
};

export default TreeSpeciesSelector;