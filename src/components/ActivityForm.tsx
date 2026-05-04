import { useState } from 'react';
import { Play } from 'lucide-react';
import type { Category } from '../types';
import { CATEGORIES, CATEGORY_COLORS } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface ActivityFormProps {
  onStart: (name: string, category: Category) => void;
  disabled: boolean;
}

export function ActivityForm({ onStart, disabled }: ActivityFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Work');
  const [showCategories, setShowCategories] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onStart(name.trim(), category);
    setName('');
  };

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="input-group">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What are you working on?"
            className="activity-input"
          />
          <div className="category-selector">
            <button
              type="button"
              className="category-btn"
              onClick={() => setShowCategories(!showCategories)}
              style={{
                borderColor: CATEGORY_COLORS[category],
                color: CATEGORY_COLORS[category],
              }}
            >
              <CategoryIcon category={category} size={16} />
              <span>{category}</span>
            </button>
            {showCategories && (
              <div className="category-dropdown">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-option ${cat === category ? 'selected' : ''}`}
                    onClick={() => {
                      setCategory(cat);
                      setShowCategories(false);
                    }}
                  >
                    <CategoryIcon category={cat} size={16} />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="start-btn"
          disabled={!name.trim() || disabled}
        >
          <Play size={20} fill="currentColor" />
          <span>Start</span>
        </button>
      </div>
    </form>
  );
}
