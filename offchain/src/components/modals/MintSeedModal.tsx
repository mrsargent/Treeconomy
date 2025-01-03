import React, { useState } from 'react'
import TreeSpeciesSelector from '../TreeSpeciesSelector';


interface MintSeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (species: string, coordinates: string, image: File | null) => void;
}


const MintSeedModal = ({ isOpen, onClose, onConfirm }: MintSeedModalProps) => {
    const [species, setSpecies] = useState<string>("Oak");
    const [coordinates, setCoordinates] = useState<string>("");
    const [image, setImage] = useState<File | null>(null);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImage(e.target.files[0]);
        }
    };

    return (
        <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
            <div className="modal-box">
                <h3 className="font-bold text-lg">Mint Seed NFT</h3>
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text text-sm font-semibold">Upload Image</span>
                    </label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="file-input file-input-bordered w-full max-w-xs"
                    />
                </div>
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
                        onClick={() => onConfirm(species, coordinates, image)}
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