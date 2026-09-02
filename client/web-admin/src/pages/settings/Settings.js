import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSetupMenus } from '../../services/auth.service';
import * as Icons from "lucide-react";
import DataGrid from '../../components/table/DataGrid';
import Skeleton from '../../utils/Skeleton';

function Settings() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredCategories = categories
        .map((category, index) => {
            const categoryKey = category.categoryName || `category-${index}`;
            const categoryName = (category.categoryName || '').toLowerCase();
            const matchedItems = (category.items || []).filter((item) => {
                const itemText = `${item.menu_name || ''} ${item.menu_url || ''} ${item.menu_item_id || ''}`.toLowerCase();
                return itemText.includes(normalizedSearch);
            });

            const hasCategoryMatch = categoryName.includes(normalizedSearch);
            const visibleItems = normalizedSearch ? matchedItems : category.items || [];

            return {
                ...category,
                categoryKey,
                items: visibleItems,
                hasMatch: normalizedSearch ? hasCategoryMatch || visibleItems.length > 0 : true
            };
        })
        .filter((category) => category.hasMatch);

    const fetchSetupMenus = async (isMounted) => {
        try {
            setLoading(true);
            const result = await getSetupMenus();

            if (!isMounted) return;

            if (result?.success) {
                const groupedCategories = result.data || [];
                setCategories(groupedCategories);

                const initialState = groupedCategories.reduce((acc, category, index) => {
                    acc[category.categoryName || `category-${index}`] = index === 0;
                    return acc;
                }, {});
                setExpandedCategories(initialState);
            } else {
                setError(result?.message || 'Unable to load setup menus.');
            }
        } catch (err) {
            if (isMounted) {
                setError(err?.message || 'Unable to load setup menus.');
            }
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    };
    useEffect(() => {
        let isMounted = true;
        fetchSetupMenus(isMounted);
        return () => {
            isMounted = false;
        };
    }, []);

    const toggleCategory = (categoryKey) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [categoryKey]: !prev[categoryKey]
        }));
    };

    if (loading) {
        return (
            <div className="space-y-4 p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>
                <div className="flex items-center justify-between rounded-xl border border-[var(--card-border)] p-4">
                    <div className="space-y-2">
                        <Skeleton variant="title" />
                        <Skeleton variant="custom" width="18rem" height="1rem" />
                    </div>
                    <Skeleton variant="button" width="12rem" />
                </div>
                <Skeleton variant="card" count={3} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>
                <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] p-6 text-sm text-[var(--danger-text)] shadow-sm">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <>
           {/* <div className='p-6'> <DataGrid /></div> */}
            <br />
            <div className="space-y-4 p-4 sm:p-6" style={{ fontSize: 'var(--app-font-size)' }}>
                <div className="flex flex-col gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-[var(--text-primary)] sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Setup menus</h1>
                        <p className="text-sm text-[var(--text-secondary)]">Browse the available setup actions grouped by category.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                        <div className="flex items-center gap-2 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                            <Icons.Search size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search setup items"
                                className="w-48 bg-transparent text-sm text-[var(--input-text)] outline-none placeholder:text-[var(--input-placeholder)]"
                            />
                        </div>
                    </div>
                </div>

                {filteredCategories.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 text-sm text-[var(--text-secondary)]">
                        {searchTerm.trim() ? 'No setup items match your search.' : 'No setup menus are available right now.'}
                    </div>
                ) : (
                    <div className="grid gap-4">

                        {filteredCategories.map((category) => {

                            const categoryKey = category.categoryKey;
                            const isExpanded = expandedCategories[categoryKey] ?? true;

                            return (

                                <div key={categoryKey}
                                    className=" overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm transition-all duration-300 hover:shadow-lg">
                                    {/* Category Header */}

                                    <button type="button" onClick={() => toggleCategory(categoryKey)}
                                        className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-[var(--card-hover-bg)]">

                                        <div className="flex items-center gap-4">

                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--icon-bg)] text-[var(--icon-color)]">
                                                <Icons.FolderOpen size={24} />
                                            </div>

                                            <div>

                                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                                    {category.categoryName}
                                                </h3>

                                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                                    {category.items?.length || 0} Modules
                                                </p>

                                            </div>

                                        </div>

                                        <div className="flex items-center gap-3">

                                            <span className="rounded-full bg-[var(--badge-bg)] px-3 py-1 text-xs font-semibold text-[var(--badge-text)]">
                                                {category.items?.length || 0}
                                            </span>

                                            {isExpanded
                                                ? <Icons.ChevronDown size={20} className="text-[var(--text-secondary)]" />
                                                : <Icons.ChevronRight size={20} className="text-[var(--text-secondary)]" />
                                            }

                                        </div>

                                    </button>

                                    {isExpanded && (

                                        <div className="grid gap-4 border-t border-[var(--card-border)] p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {category.items?.map((item) => {

                                                const Icon = Icons[item.icon] || Icons.Settings;

                                                return (

                                                    <Link key={item.menu_item_id} to={item.menu_url || "#"}
                                                        className="group flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] 
                                p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--card-hover-bg)] hover:shadow-md">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--icon-bg)] text-[var(--icon-color)]">

                                                                <Icon size={22} />

                                                            </div>

                                                            <div>

                                                                <p className="font-semibold text-[var(--text-primary)]">
                                                                    {item.menu_name}
                                                                </p>

                                                                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                                                    Configure {item.menu_name.toLowerCase()}
                                                                </p>

                                                            </div>

                                                        </div>

                                                        <Icons.ArrowRight size={18} className="text-[var(--text-secondary)] transition-transform duration-300 group-hover:translate-x-1" />
                                                    </Link>

                                                );

                                            })}

                                        </div>

                                    )}

                                </div>

                            );

                        })}
                    </div>
                )}
            </div>
        </>
    );
}

export default Settings;
