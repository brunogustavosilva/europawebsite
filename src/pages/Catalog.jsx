import { PresenceList } from '../components/PresenceList.jsx';
import { useState } from 'react';
import { categories } from '../data/site.js';
import { normalize } from '../utils/format.js';
import { useCart } from '../context/CartContext.jsx';
import { EquipmentCard } from '../components/EquipmentCard.jsx';

export function Catalog() {
    const [query, setQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sort, setSort] = useState('popular');
    const [announcement, setAnnouncement] = useState('');
    const { changeQuantity, equipamentos, catalogStatus } = useCart();

    const matches = equipamentos
        .map((equipment) => {
            const search = normalize(query);
            const score = !search ? 1
                : normalize(equipment.nome).includes(search) ? 3
                : normalize(equipment.ideal).includes(search) ? 2
                : normalize(equipment.descricao).includes(search) ? 1 : 0;

            return { equipment, score };
        })
        .filter(({ equipment, score }) => score > 0 && (
            selectedCategories.length === 0 ||
            selectedCategories.some((category) => equipment.categorias.includes(category))
        ))
        .sort((a, b) => {
            if (query && a.score !== b.score) return b.score - a.score;
            if (sort === 'price-asc') return a.equipment.preco - b.equipment.preco;
            if (sort === 'price-desc') return b.equipment.preco - a.equipment.preco;
            return b.equipment.popularidade - a.equipment.popularidade;
        });

    function toggleCategory(value) {
        setSelectedCategories((current) => current.includes(value)
            ? current.filter((category) => category !== value)
            : [...current, value]);
    }

    function addItem(equipment) {
        changeQuantity(equipment.id, 1);
        setAnnouncement(`${equipment.nome} adicionado à sacola.`);
    }

    return (
        <main className="section catalog-main" id="main-content">
            <div className="catalog-intro">
                <p className="eyebrow">SEU PRÓXIMO EVENTO COMEÇA AQUI</p>
                <h1>Encontre a iluminação<br /><span>ideal para sua festa.</span></h1>
                <p className="muted">Veja os efeitos, escolha seus favoritos e monte sua locação.</p>
            </div>
            <section className="catalog-tools" aria-label="Busca e organização">
                <label className="search-field">
                    <span className="sr-only">Buscar equipamentos</span>
                    <input type="search" placeholder="Busque por equipamento, efeito ou ocasião..." value={query} onChange={(event) => setQuery(event.target.value)} />
                </label>
                <label>
                    <span className="sr-only">Ordenar equipamentos</span>
                    <select value={sort} onChange={(event) => setSort(event.target.value)}>
                        <option value="popular">Mais populares</option>
                        <option value="price-asc">Menor preço</option>
                        <option value="price-desc">Maior preço</option>
                    </select>
                </label>
            </section>
            <fieldset className="category-filters">
                <legend className="sr-only">Categorias</legend>
                {categories.map((category) => (
                    <label className="filter-chip" key={category.value}>
                        <input type="checkbox" checked={selectedCategories.includes(category.value)} onChange={() => toggleCategory(category.value)} />
                        <span>{category.label}</span>
                    </label>
                ))}
            </fieldset>
            <p className="catalog-count muted" aria-live="polite">
                {catalogStatus === 'loading' ? 'Carregando equipamentos…'
                    : catalogStatus === 'error' ? 'Não foi possível carregar o catálogo. Recarregue a página para tentar novamente.'
                    : `${matches.length} ${matches.length === 1 ? 'equipamento encontrado' : 'equipamentos encontrados'}`}
            </p>
            <section className="equipment-grid" aria-label="Equipamentos disponíveis">
                <PresenceList items={matches} getKey={({ equipment }) => equipment.id}>
                    {({ equipment }) => (
                        <EquipmentCard equipment={equipment} onAdd={addItem} />
                    )}
                </PresenceList>
            </section>
            {catalogStatus === 'ready' && !matches.length && <p className="empty-state">Nenhum equipamento encontrado. Tente outro termo ou categoria.</p>}
            <p className="status-message" role="status">{announcement}</p>
        </main>
    );
}
