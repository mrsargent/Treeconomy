import React, { useState } from 'react'
import TreeSpeciesSelector from './TreeSpeciesSelector';


interface MintSeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (species: string, coordinates: string) => void;
}


const MintSeedModal = ({ isOpen, onClose, onConfirm }: MintSeedModalProps) => {
    const [species, setSpecies] = useState<string>("Oak");
    const [coordinates, setCoordinates] = useState<string>("");

    if (!isOpen) return null;

    return (
        <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
            <div className="modal-box">
                <h3 className="font-bold text-lg">Mint Seed NFT</h3>
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text text-sm font-semibold">Species of Tree</span>
                    </label>
                    <TreeSpeciesSelector onSelect={setSpecies} />
                </div>
                <div className='form-control mb-4'>
                    <label className="label">
                        <span className="label-text text-sm font-semibold">Coordinates</span>
                    </label>
                    <input
                        type="text"
                        value={coordinates}
                        onChange={(e) => setCoordinates(e.target.value)}
                        placeholder="Coordinates"
                        className="input input-bordered w-full max-w-xs mt-4"
                    />
                </div>
                <div className="modal-action">
                    <button
                        onClick={onClose}
                        className="btn btn-outline"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(species, coordinates)}
                        className="btn btn-primary"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MintSeedModal